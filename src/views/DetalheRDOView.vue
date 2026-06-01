<template>
  <div class="screen">
    <div class="topbar">
      <button class="back-btn" @click="$router.back()" title="Voltar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
          <path d="M15 19l-7-7 7-7"/>
        </svg>
      </button>
      <div style="font-size:13px;color:var(--muted);padding:0 12px">{{ formatarData(rdo?.data) }}</div>
      <div v-if="rdo" class="topbar-acoes">
        <button class="btn-icon" @click="gerarPDF" :disabled="gerando" title="Gerar PDF">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
        </button>
        <button class="btn-icon" @click="compartilhar" title="Compartilhar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22">
            <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
        </button>
      </div>
    </div>

    <div class="scroll">
      <div v-if="!rdo" class="vazio"><p>RDO não encontrado.</p></div>
      <template v-else>

        <!-- Cabeçalho -->
        <div class="card">
          <div class="rdo-topo">
            <span class="badge" :class="rdo.status === 'sincronizado' ? 'badge-concluida' : 'badge-pendente'">
              {{ rdo.status === 'sincronizado' ? 'Sincronizado' : 'Pendente' }}
            </span>
            <span class="rdo-criado">Criado em {{ formatarDataHora(rdo.criado_em) }}</span>
          </div>

          <div class="meta-lista">
            <div v-if="nomeObra" class="meta-linha">
              <span class="meta-label">Obra</span>
              <span>{{ nomeObra }}</span>
            </div>
            <div v-if="osVinculadas.length > 0" class="meta-linha">
              <span class="meta-label">OS vinculada{{ osVinculadas.length > 1 ? 's' : '' }}</span>
              <span class="os-tags">
                <span v-for="os in osVinculadas" :key="os" class="os-tag">{{ os }}</span>
              </span>
            </div>
            <div class="meta-linha">
              <span class="meta-label">Horas trabalhadas</span>
              <span>{{ rdo.horas_trabalhadas }}h</span>
            </div>
            <div class="meta-linha">
              <span class="meta-label">Efetivo</span>
              <span>{{ rdo.efetivo }} pessoa{{ rdo.efetivo !== 1 ? 's' : '' }}</span>
            </div>
          </div>
        </div>

        <!-- Atividades realizadas -->
        <div class="card">
          <h3 class="secao-titulo">Atividades realizadas</h3>
          <p class="secao-texto">{{ rdo.descricao }}</p>
        </div>

        <!-- Ordens de Serviço -->
        <div v-if="osDetalhes.length > 0" class="card">
          <h3 class="secao-titulo">Ordens de Serviço</h3>
          <div v-for="os in osDetalhes" :key="os.id" class="os-detalhe">
            <div class="os-detalhe-header">
              <span class="os-tag">#{{ os.id }}</span>
              <span v-if="os.titulo" class="os-detalhe-titulo">{{ os.titulo }}</span>
            </div>
            <p v-if="os.descricao" class="secao-texto os-detalhe-desc">{{ os.descricao }}</p>
          </div>
        </div>

        <!-- Observações -->
        <div v-if="rdo.observacoes" class="card">
          <h3 class="secao-titulo">Observações</h3>
          <p class="secao-texto">{{ rdo.observacoes }}</p>
        </div>

        <!-- Fotos -->
        <div v-if="fotos.length > 0" class="card">
          <h3 class="secao-titulo">Fotos ({{ fotos.length }})</h3>
          <div class="fotos-grid">
            <div v-for="(foto, idx) in fotos" :key="idx" class="foto-item"
                 @click="abrirFoto(foto)">
              <img :src="foto.src ?? foto.dados ?? foto.preview" :alt="`Foto ${idx + 1}`" />
            </div>
          </div>
        </div>

      </template>
    </div>

    <!-- Lightbox -->
    <div v-if="fotoAberta" class="lightbox" @click="fotoAberta = null">
      <img :src="fotoAberta" alt="Foto ampliada" @click.stop />
      <button class="lightbox-fechar" @click="fotoAberta = null">✕</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute }      from 'vue-router'
import { Capacitor }     from '@capacitor/core'
import { Share }         from '@capacitor/share'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { rdosStore }     from '../stores/rdos'
import { catalogoStore } from '../stores/catalogo'

const route = useRoute()

const rdo = computed(() =>
  rdosStore.lista.find(r => r._id === route.params.id) ?? history.state?.rdo ?? null
)

const fotos = computed(() => {
  const f = rdo.value?.fotos
  if (!Array.isArray(f)) return []
  return f
})

const nomeObra = computed(() => {
  const id = String(rdo.value?.obra_id ?? '')
  if (!id) return null
  const obra = catalogoStore.getObras().find(o => String(o.id) === id)
  return obra?.nome ?? `Obra #${id}`
})

const osDetalhes = computed(() => {
  const r = rdo.value
  if (!r) return []
  const ids = Array.isArray(r.os_ids) && r.os_ids.length > 0
    ? r.os_ids
    : r.os_id ? [r.os_id] : []
  if (!ids.length) return []
  const encontradas = catalogoStore.getOrdensByIds(ids)
  return ids.map(id => {
    const os = encontradas.find(o => String(o.id) === String(id))
    return { id, titulo: os?.titulo || null, descricao: os?.descricao || null }
  })
})

const osVinculadas = computed(() =>
  osDetalhes.value.map(os => String(os.id))
)

const fotoAberta = ref(null)
const gerando    = ref(false)

function abrirFoto(foto) {
  fotoAberta.value = foto.src ?? foto.dados ?? foto.preview
}

function formatarData(d) {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

function formatarDataHora(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('pt-BR')
}

async function obterBase64Foto(foto) {
  if (foto.dados?.startsWith('data:')) return foto.dados
  if (foto.path && Capacitor.isNativePlatform()) {
    const { data } = await Filesystem.readFile({ path: foto.path, directory: Directory.Data })
    return `data:image/jpeg;base64,${data}`
  }
  if (foto.src) {
    try {
      const res  = await fetch(foto.src)
      const blob = await res.blob()
      return await new Promise(resolve => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result)
        reader.readAsDataURL(blob)
      })
    } catch { return null }
  }
  return null
}

async function gerarPDF() {
  const r = rdo.value
  if (!r || gerando.value) return
  gerando.value = true

  try {
    const { default: jsPDF } = await import('jspdf')
    const doc   = new jsPDF({ unit: 'mm', format: [210, 297] })
    const pageW = 210
    const pageH = 297
    const mg    = 15
    const cW    = pageW - mg * 2
    let y       = 0

    const C = {
      primary:   [26,  58, 107],
      accent:    [234, 88,  12],
      lightBg:   [248, 249, 250],
      midGray:   [229, 231, 235],
      dark:      [17,  24,  39],
      muted:     [107, 114, 128],
      white:     [255, 255, 255],
      green:     [16,  185, 129],
      amber:     [245, 158,  11],
    }

    const checkPage = (needed = 10) => {
      if (y + needed > pageH - 20) { doc.addPage(); y = 15 }
    }

    // ── Banner de cabeçalho ──────────────────────────────────────────────────
    doc.setFillColor(...C.primary)
    doc.rect(0, 0, pageW, 36, 'F')
    doc.setFillColor(...C.accent)
    doc.rect(0, 33, pageW, 3, 'F')

    doc.setTextColor(...C.white)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    doc.text('Relatório Diário de Obra', mg, 15)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text('CRCC - Zetta', mg, 24)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text(formatarData(r.data), pageW - mg, 15, { align: 'right' })

    doc.setTextColor(...C.dark)
    y = 48

    // ── Card de metadados ────────────────────────────────────────────────────
    const metaItems = [
      ['Obra',             nomeObra.value || '—'],
      osDetalhes.value.length > 0 ? [`OS Vinculada${osDetalhes.value.length > 1 ? 's' : ''}`, osDetalhes.value.map(os => `#${os.id}`).join(', ')] : null,
      ['Horas trabalhadas', `${r.horas_trabalhadas}h`],
      ['Efetivo',          `${r.efetivo} pessoa${r.efetivo !== 1 ? 's' : ''}`],
      ['Status',           r.status === 'sincronizado' ? 'Sincronizado' : 'Pendente'],
    ].filter(Boolean)

    const cardH = metaItems.length * 8 + 8
    doc.setFillColor(...C.lightBg)
    doc.roundedRect(mg, y - 4, cW, cardH, 3, 3, 'F')
    doc.setDrawColor(...C.midGray)
    doc.roundedRect(mg, y - 4, cW, cardH, 3, 3, 'S')

    metaItems.forEach(([label, valor], idx) => {
      const rowY = y + idx * 8
      if (idx % 2 !== 0) {
        doc.setFillColor(240, 242, 245)
        doc.rect(mg + 1, rowY - 4, cW - 2, 8, 'F')
      }
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(...C.muted)
      doc.text(label.toUpperCase(), mg + 4, rowY + 1.5)

      if (label === 'Status') {
        const isSync = r.status === 'sincronizado'
        doc.setFillColor(...(isSync ? C.green : C.amber))
        doc.roundedRect(mg + 52, rowY - 3, 28, 5.5, 1.5, 1.5, 'F')
        doc.setTextColor(...C.white)
        doc.setFontSize(8)
        doc.setFont('helvetica', 'bold')
        doc.text(valor, mg + 52 + 14, rowY + 1.5, { align: 'center' })
      } else {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(10)
        doc.setTextColor(...C.dark)
        doc.text(String(valor), mg + 52, rowY + 1.5)
      }
    })

    y += cardH + 8

    // ── Helper de seção ──────────────────────────────────────────────────────
    const addSection = (title) => {
      checkPage(16)
      doc.setFillColor(...C.accent)
      doc.rect(mg, y, 3, 7, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.setTextColor(...C.primary)
      doc.text(title, mg + 6, y + 5.5)
      y += 11
      doc.setDrawColor(...C.midGray)
      doc.line(mg, y, pageW - mg, y)
      y += 5
    }

    // ── Atividades ───────────────────────────────────────────────────────────
    addSection('Atividades Realizadas')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(...C.dark)
    doc.splitTextToSize(r.descricao || '', cW)
      .forEach(l => { checkPage(6); doc.text(l, mg, y); y += 5 })
    y += 6

    // ── Ordens de Serviço ────────────────────────────────────────────────────
    if (osDetalhes.value.length > 0) {
      addSection('Ordens de Serviço')
      osDetalhes.value.forEach(os => {
        checkPage(14)
        doc.setFillColor(...C.lightBg)
        doc.roundedRect(mg, y - 2, cW, 8, 2, 2, 'F')
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(10)
        doc.setTextColor(...C.primary)
        const titulo = os.titulo ? `OS #${os.id} – ${os.titulo}` : `OS #${os.id}`
        doc.text(titulo, mg + 4, y + 4)
        y += 12
        if (os.descricao) {
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(10)
          doc.setTextColor(...C.dark)
          doc.splitTextToSize(os.descricao, cW - 4)
            .forEach(l => { checkPage(6); doc.text(l, mg + 4, y); y += 5 })
          y += 4
        }
      })
      y += 2
    }

    // ── Observações ──────────────────────────────────────────────────────────
    if (r.observacoes) {
      addSection('Observações')
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(...C.dark)
      doc.splitTextToSize(r.observacoes, cW)
        .forEach(l => { checkPage(6); doc.text(l, mg, y); y += 5 })
      y += 6
    }

    // ── Fotos ────────────────────────────────────────────────────────────────
    if (fotos.value.length > 0) {
      addSection(`Registro Fotográfico (${fotos.value.length})`)
      const fotoW = (cW - 6) / 2
      const fotoH = fotoW * 0.75

      for (let i = 0; i < fotos.value.length; i++) {
        const imgData = await obterBase64Foto(fotos.value[i])
        if (!imgData) continue
        const col = i % 2
        if (col === 0) checkPage(fotoH + 8)
        const x = mg + col * (fotoW + 6)
        doc.setDrawColor(...C.midGray)
        doc.setFillColor(...C.white)
        doc.roundedRect(x - 1, y - 1, fotoW + 2, fotoH + 2, 2, 2, 'FD')
        doc.addImage(imgData, 'JPEG', x, y, fotoW, fotoH)
        if (col === 1 || i === fotos.value.length - 1) y += fotoH + 6
      }
    }

    // ── Rodapé em todas as páginas ───────────────────────────────────────────
    const totalPages = doc.getNumberOfPages()
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p)
      doc.setDrawColor(...C.midGray)
      doc.line(mg, pageH - 14, pageW - mg, pageH - 14)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...C.muted)
      doc.text(`CRCC - Zetta  ·  Gerado em ${new Date().toLocaleString('pt-BR')}`, mg, pageH - 8)
      doc.setFont('helvetica', 'bold')
      doc.text(`${p} / ${totalPages}`, pageW - mg, pageH - 8, { align: 'right' })
    }
    doc.setTextColor(0)

    const nomeArquivo = `RDO_${r.data || 'sem-data'}.pdf`
    const pdfBase64   = doc.output('datauristring').split(',')[1]

    if (Capacitor.isNativePlatform()) {
      const { uri } = await Filesystem.writeFile({
        path: nomeArquivo,
        data: pdfBase64,
        directory: Directory.Cache,
      })
      await Share.share({ title: nomeArquivo, files: [uri], dialogTitle: 'Exportar PDF' })
    } else {
      doc.save(nomeArquivo)
    }
  } catch (e) {
    console.error('Erro ao gerar PDF:', e)
  } finally {
    gerando.value = false
  }
}

function montarTexto() {
  const r = rdo.value
  const linhas = [
    `📋 *RDO - CRCC Zetta*`,
    `📅 Data: ${formatarData(r.data)}`,
  ]

  if (nomeObra.value)  linhas.push(`🏗️ Obra: ${nomeObra.value}`)
  if (r.os_id)         linhas.push(`🔧 OS vinculada: #${r.os_id}`)

  linhas.push(`⏱️ Horas trabalhadas: ${r.horas_trabalhadas}h`)
  linhas.push(`👷 Efetivo: ${r.efetivo} pessoa${r.efetivo !== 1 ? 's' : ''}`)

  linhas.push(``)
  linhas.push(`📝 *Atividades realizadas:*`)
  linhas.push(r.descricao)

  if (r.observacoes) {
    linhas.push(``)
    linhas.push(`💬 *Observações:*`)
    linhas.push(r.observacoes)
  }

  if (fotos.value.length > 0) {
    linhas.push(``)
    linhas.push(`📷 ${fotos.value.length} foto${fotos.value.length !== 1 ? 's' : ''} anexada${fotos.value.length !== 1 ? 's' : ''}`)
  }

  linhas.push(``)
  linhas.push(`_Enviado via CRCC - Zetta_`)

  return linhas.join('\n')
}

async function resolverUriParaShare(foto) {
  if (foto.path && Capacitor.isNativePlatform()) {
    const { uri } = await Filesystem.getUri({ path: foto.path, directory: Directory.Data })
    return uri
  }
  const dataUrl = foto.dados ?? foto.preview
  if (!dataUrl) return null
  const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl
  const ext = foto.nome?.split('.').pop() || 'jpg'
  const nome = `share_temp_${Date.now()}.${ext}`
  const result = await Filesystem.writeFile({ path: nome, data: base64, directory: Directory.Cache })
  return result.uri
}

async function compartilhar() {
  const texto = montarTexto()

  try {
    const shareData = { title: 'RDO - CRCC Zetta', text: texto, dialogTitle: 'Compartilhar RDO' }

    if (fotos.value.length > 0) {
      const uris = (await Promise.all(fotos.value.map(resolverUriParaShare))).filter(Boolean)
      if (uris.length > 0) shareData.files = uris
    }

    await Share.share(shareData)
  } catch (e) {
    if (e?.message?.includes('cancel') || e?.message?.includes('abort')) return
    // Fallback: WhatsApp via deep link (sem fotos)
    const url = `https://wa.me/?text=${encodeURIComponent(texto)}`
    window.open(url, '_blank')
  }
}
</script>

<style scoped>
.topbar-acoes { display: flex; gap: 4px; align-items: center; }
.btn-icon {
  background: none;
  border: none;
  color: var(--muted);
  cursor: pointer;
  padding: 4px;
  display: flex;
}
.btn-icon:disabled { opacity: 0.4; }
.rdo-topo {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.rdo-criado { font-size: 12px; color: var(--muted); }

.meta-lista { display: flex; flex-direction: column; gap: 8px; }
.meta-linha {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: var(--text);
}
.meta-label { color: var(--muted); font-weight: 600; }
.os-tags { display: flex; flex-wrap: wrap; gap: 4px; justify-content: flex-end; }
.os-tag {
  background: rgba(25,118,210,.1);
  color: var(--primary);
  font-size: 12px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 20px;
}
.os-detalhe { padding: 10px 0; border-bottom: 1px solid var(--border); }
.os-detalhe:last-child { border-bottom: none; padding-bottom: 0; }
.os-detalhe-header { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.os-detalhe-titulo { font-size: 14px; font-weight: 600; color: var(--text); }
.os-detalhe-desc { margin-top: 4px; }

.secao-titulo { font-size: 13px; font-weight: 700; color: var(--muted); margin-bottom: 8px; text-transform: uppercase; letter-spacing: .5px; }
.secao-texto  { font-size: 14px; color: var(--text); white-space: pre-wrap; line-height: 1.5; }

.fotos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 10px;
}
.foto-item {
  aspect-ratio: 1;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid var(--border);
  cursor: pointer;
}
.foto-item img { width: 100%; height: 100%; object-fit: cover; }

.lightbox {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.92);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  padding: 16px;
}
.lightbox img {
  max-width: 100%;
  max-height: 100%;
  border-radius: 8px;
  object-fit: contain;
}
.lightbox-fechar {
  position: absolute;
  top: 16px;
  right: 16px;
  background: rgba(255,255,255,.15);
  color: #fff;
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
