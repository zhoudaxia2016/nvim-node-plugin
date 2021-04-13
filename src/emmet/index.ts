import type { NvimPlugin } from 'neovim'
import emmet from 'emmet'
export default function(plugin: NvimPlugin) {
  plugin.registerFunction('Emmet', async function() {
    let start = await plugin.nvim.callFunction('col', '.')
    let line = await plugin.nvim.callFunction('getline', '.')
    while (start > 0 && !/\s/.test(line[start - 1]))
      start -= 1
    let trigger = line.slice(start)
    const expand = emmet(trigger, {
      options: {
        'output.field': () => '@@'
      }
    })
    const lineNum = await plugin.nvim.callFunction('line', '.')
    let expandList = expand.split('\n')
    const indent = ' '.repeat((await plugin.nvim.callFunction('indent', '.')))
    debugger
    expandList = expandList.map(_ => indent + _)
    setTimeout(() => {
      plugin.nvim.callFunction('append', [lineNum, expandList])
      plugin.nvim.deleteCurrentLine()
      plugin.nvim.command('normal 0')
    })
    return ''
  }, { sync: true })
  plugin.nvim.command('inoremap <expr> <c-e> Emmet()')
}
