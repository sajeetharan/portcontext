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
Type "portcontext init --owner ""Sajee""" Sleep 400ms Enter
Sleep 1s

Type "# Teach it who you are and how you work" Sleep 600ms Enter
Type "portcontext add --section identity --text ""Sajee - PM at Microsoft, Azure Cosmos DB""" Sleep 300ms Enter
Sleep 700ms
Type "portcontext add --section preferences --text ""TypeScript, strict mode""" Sleep 300ms Enter
Sleep 700ms
Type "portcontext add --section project --text ""Building portcontext + why-graph (open-source)""" Sleep 300ms Enter
Sleep 1s

Type "# Review it" Sleep 600ms Enter
Type "portcontext list" Sleep 300ms Enter
Sleep 1500ms

Type "# Export to EVERY tool at once" Sleep 600ms Enter
Type "portcontext export --to all" Sleep 300ms Enter
Sleep 3s

# Clean up
Hide
Type "Remove-Item -Recurse -Force .portcontext -ErrorAction SilentlyContinue" Enter
Show
