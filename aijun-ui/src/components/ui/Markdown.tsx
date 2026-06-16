import { Fragment, type ReactNode } from 'react'

// Minimal markdown renderer for the analyst report bodies: tables, bullet/numbered lists, bold and
// paragraphs. Intentionally tiny (no dependency); the analyst output only uses these constructs.

type Block =
  | { kind: 'table'; rows: string[][] }
  | { kind: 'ul'; items: string[] }
  | { kind: 'ol'; items: string[] }
  | { kind: 'p'; text: string }

const BULLET = /^[-*•]\s+(.*)$/
const NUMBERED = /^\d+[.)]\s+(.*)$/
const SEP_CELL = /^:?-{2,}:?$/

function cells(line: string): string[] {
  const out = line.split('|').map((c) => c.trim())
  if (out.length && out[0] === '') out.shift()
  if (out.length && out[out.length - 1] === '') out.pop()
  return out
}

function parseBlocks(md: string): Block[] {
  const lines = md.split(/\r?\n/)
  const blocks: Block[] = []
  let para: string[] = []

  const flushPara = () => {
    if (para.length) {
      blocks.push({ kind: 'p', text: para.join(' ') })
      para = []
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) {
      flushPara()
      continue
    }
    if (line.startsWith('|')) {
      flushPara()
      const rows: string[][] = []
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        const c = cells(lines[i].trim())
        if (!c.every((x) => SEP_CELL.test(x) || x === '')) rows.push(c)
        i++
      }
      i--
      if (rows.length) blocks.push({ kind: 'table', rows })
      continue
    }
    if (BULLET.test(line)) {
      flushPara()
      const items: string[] = []
      while (i < lines.length && BULLET.test(lines[i].trim())) {
        items.push(lines[i].trim().match(BULLET)![1])
        i++
      }
      i--
      blocks.push({ kind: 'ul', items })
      continue
    }
    if (NUMBERED.test(line)) {
      flushPara()
      const items: string[] = []
      while (i < lines.length && NUMBERED.test(lines[i].trim())) {
        items.push(lines[i].trim().match(NUMBERED)![1])
        i++
      }
      i--
      blocks.push({ kind: 'ol', items })
      continue
    }
    para.push(line)
  }
  flushPara()
  return blocks
}

/** Renders **bold** inline; everything else is plain text. */
function inline(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((p, i) => {
    const m = p.match(/^\*\*([^*]+)\*\*$/)
    return m ? (
      <strong key={i} className="font-semibold text-slate-100">
        {m[1]}
      </strong>
    ) : (
      <Fragment key={i}>{p}</Fragment>
    )
  })
}

export function Markdown({ children }: { children: string }) {
  const blocks = parseBlocks(children)
  return (
    <div className="flex flex-col gap-2.5 text-xs leading-relaxed text-slate-300">
      {blocks.map((block, i) => {
        switch (block.kind) {
          case 'table': {
            const [header, ...body] = block.rows
            return (
              <div key={i} className="overflow-x-auto rounded-lg border border-white/10">
                <table className="w-full border-collapse text-left text-[0.7rem]">
                  <thead>
                    <tr className="bg-white/[0.04] text-slate-400">
                      {header.map((h, j) => (
                        <th key={j} className="px-2.5 py-1.5 font-medium">
                          {inline(h)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {body.map((row, r) => (
                      <tr key={r} className="border-t border-white/5 align-top">
                        {row.map((cell, c) => (
                          <td key={c} className="px-2.5 py-1.5 text-slate-300">
                            {inline(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          }
          case 'ul':
            return (
              <ul key={i} className="flex flex-col gap-1.5">
                {block.items.map((it, j) => (
                  <li key={j} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand-cyan/70" />
                    <span>{inline(it)}</span>
                  </li>
                ))}
              </ul>
            )
          case 'ol':
            return (
              <ol key={i} className="flex flex-col gap-1.5">
                {block.items.map((it, j) => (
                  <li key={j} className="flex items-start gap-2">
                    <span className="font-mono text-[0.65rem] text-brand-cyan">{j + 1}.</span>
                    <span>{inline(it)}</span>
                  </li>
                ))}
              </ol>
            )
          default:
            return <p key={i}>{inline(block.text)}</p>
        }
      })}
    </div>
  )
}
