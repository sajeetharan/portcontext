# portcontext demo — recorded with VHS (https://github.com/charmbracelet/vhs)
# Regenerate the GIF with:  vhs demo/portcontext.tape
#
# Output
Output demo/portcontext.gif

# Terminal look
Set Shell "pwsh"
Set FontSize 20
Set Width 1200
Set Height 700
Set Padding 20
Set Theme "Dracula"
Set TypingSpeed 60ms

# Start clean
Hide
Type "Remove-Item -Recurse -Force .portcontext -ErrorAction SilentlyContinue; Clear-Host" Enter
Show

Type "# Set up your AI context once..." Sleep 800ms Enter
Type "portcontext init --owner ""Jane Dev""" Sleep 400ms Enter
Sleep 1s

Type "# Add facts about how you work" Sleep 600ms Enter
Type "portcontext add --section preferences --text ""Prefer TypeScript, strict mode""" Sleep 300ms Enter
Sleep 800ms
Type "portcontext add --section style --text ""2-space indent, trailing commas"" --tags formatting" Sleep 300ms Enter
Sleep 1s

Type "# Review it" Sleep 600ms Enter
Type "portcontext list" Sleep 300ms Enter
Sleep 1500ms

Type "# Export to any tool (Copilot / Cursor / Claude)" Sleep 600ms Enter
Type "portcontext export --to markdown" Sleep 300ms Enter
Sleep 3s

# Clean up
Hide
Type "Remove-Item -Recurse -Force .portcontext -ErrorAction SilentlyContinue" Enter
Show
