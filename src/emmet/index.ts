import type { NvimPlugin } from 'neovim'
import emmet from 'emmet'
let ns_id: number
let placeholders = []
export default function(plugin: NvimPlugin) {
  plugin.registerFunction('Emmet', async function() {
    let start = await plugin.nvim.callFunction('col', '.')
    let line = await plugin.nvim.callFunction('getline', '.')
    while (start > 0 && !/\s/.test(line[start - 1]))
      start -= 1
    let trigger = line.slice(start)
    const expand = emmet(trigger, {
      options: {
        'output.field': () => '_'
      }
    })
    const lineNum = await plugin.nvim.callFunction('line', '.')
    let expandList = expand.split('\n')
    const indent = ' '.repeat((await plugin.nvim.callFunction('indent', '.')))
    expandList = expandList.map(_ => indent + _)
    placeholders = []
    for(const [i, _] of expandList.entries()) {
      placeholders = placeholders.concat([..._.matchAll(/_/g)].map(m => {
        return {
          col: m.index,
          row: i + lineNum - 1
        }
      }))
    }
    ns_id = await plugin.nvim.callFunction('nvim_create_namespace', 'emmet')
    setTimeout(async () => {
      await plugin.nvim.callFunction('append', [lineNum, expandList])
      await plugin.nvim.deleteCurrentLine()
      plugin.nvim.command('normal 0')
      plugin.nvim.callFunction('nvim_buf_clear_namespace', [0, ns_id, 0, -1])
      placeholders.forEach(_ => {
        plugin.nvim.callFunction('nvim_buf_set_extmark', [0, ns_id, _.row, _.col, { hl_group: 'Search', end_col: _.col + 1 }])
      })
    })
    return ''
  }, { sync: true })
  plugin.nvim.command('inoremap <expr> <c-e> Emmet()')
  async function handleJump() {
    const mark = await plugin.nvim.callFunction('nvim_buf_get_extmarks', [0, ns_id, 0, -1, {}])
    setTimeout(async () => {
      if (mark.length > 0)  {
        const [id, row, col] = mark[0]
        await plugin.nvim.callFunction('cursor', [row + 1, col + 1])
        plugin.nvim.command('normal gh')
        plugin.nvim.callFunction('nvim_buf_del_extmark', [0, ns_id, id])
      }
      if (mark.length === 1) {
        plugin.nvim.command('iunmap <c-j>')
        plugin.nvim.callFunction('nvim_buf_clear_namespace', [0, ns_id, 0, -1])
      }
    })
    return ''
  }
  plugin.registerFunction('EmmetJump', handleJump, { sync: true })
  plugin.nvim.command('inoremap <c-j> <esc>:call EmmetJump()<cr>')
}
