import re

with open('app/careers/[company]/page.tsx', 'r') as f:
    content = f.read()

# Backgrounds
content = re.sub(r'bg-zinc-950/40', 'bg-white/80', content)
content = re.sub(r'bg-zinc-950', 'bg-gray-50', content)
content = re.sub(r'bg-zinc-900/60', 'bg-gray-50/80', content)
content = re.sub(r'bg-zinc-900/40', 'bg-white', content)
content = re.sub(r'bg-zinc-900/20', 'bg-white/50', content)
content = re.sub(r'bg-zinc-900', 'bg-white', content)
content = re.sub(r'bg-zinc-850', 'bg-white', content)
content = re.sub(r'bg-zinc-800', 'bg-gray-100', content)
content = re.sub(r'bg-zinc-100', 'bg-gray-900', content)

# Text
content = re.sub(r'text-white', 'text-gray-900', content)
content = re.sub(r'text-zinc-100', 'text-gray-900', content)
content = re.sub(r'text-zinc-200', 'text-gray-800', content)
content = re.sub(r'text-zinc-300', 'text-gray-700', content)
content = re.sub(r'text-zinc-400', 'text-gray-500', content)
content = re.sub(r'text-zinc-500', 'text-gray-400', content)
content = re.sub(r'text-zinc-600', 'text-gray-400', content)
content = re.sub(r'text-zinc-700', 'text-gray-300', content)
content = re.sub(r'text-zinc-800', 'text-gray-300', content)
content = re.sub(r'text-zinc-950', 'text-white', content)

# Borders
content = re.sub(r'border-zinc-900/80', 'border-gray-200', content)
content = re.sub(r'border-zinc-900/60', 'border-gray-200', content)
content = re.sub(r'border-zinc-900/40', 'border-gray-100', content)
content = re.sub(r'border-zinc-900', 'border-gray-200', content)
content = re.sub(r'border-zinc-850', 'border-gray-200', content)
content = re.sub(r'border-zinc-800/80', 'border-gray-200', content)
content = re.sub(r'border-zinc-800/60', 'border-gray-200', content)
content = re.sub(r'border-zinc-800', 'border-gray-200', content)
content = re.sub(r'border-zinc-700/80', 'border-gray-300', content)
content = re.sub(r'border-zinc-700', 'border-gray-300', content)
content = re.sub(r'border-zinc-600', 'border-gray-300', content)

# Hovers
content = re.sub(r'hover:text-white', 'hover:text-gray-900', content)
content = re.sub(r'hover:text-zinc-200', 'hover:text-gray-800', content)
content = re.sub(r'hover:text-zinc-300', 'hover:text-gray-700', content)
content = re.sub(r'hover:bg-zinc-900/20', 'hover:bg-gray-50/50', content)
content = re.sub(r'hover:bg-zinc-850', 'hover:bg-gray-50', content)
content = re.sub(r'hover:bg-zinc-800/40', 'hover:bg-gray-50', content)
content = re.sub(r'hover:bg-zinc-800/60', 'hover:bg-gray-100', content)
content = re.sub(r'hover:bg-white', 'hover:bg-gray-800', content)

# Other specific tweaks for a bright/clean Apple-like theme
content = re.sub(r'border-t-zinc-200', 'border-t-gray-900', content)
content = re.sub(r'border-zinc-800', 'border-gray-200', content)
content = re.sub(r'shadow-xl', 'shadow-sm', content)
content = re.sub(r'shadow-lg', 'shadow-sm', content)

# Background gradients
content = content.replace('rgba(39,39,42,0.2)', 'rgba(243,244,246,0.8)')
content = content.replace('rgba(39,39,42,0.15)', 'rgba(243,244,246,0.6)')

# Status badges - Make them solid pastel colors or softer
content = content.replace('bg-blue-500/10 border-blue-500/20 text-blue-400', 'bg-blue-50 border-blue-100 text-blue-700')
content = content.replace('bg-purple-500/10 border-purple-500/20 text-purple-400', 'bg-purple-50 border-purple-100 text-purple-700')
content = content.replace('bg-amber-500/10 border-amber-500/20 text-amber-400', 'bg-amber-50 border-amber-100 text-amber-700')
content = content.replace('bg-orange-500/10 border-orange-500/20 text-orange-400', 'bg-orange-50 border-orange-100 text-orange-700')
content = content.replace('bg-emerald-500/10 border-emerald-500/20 text-emerald-400', 'bg-emerald-50 border-emerald-100 text-emerald-700')
content = content.replace('bg-green-500/20 border-green-500/30 text-green-400', 'bg-green-50 border-green-200 text-green-700')
content = content.replace('bg-emerald-500/[0.02] backdrop-blur-md border border-emerald-500/20', 'bg-emerald-50/50 backdrop-blur-md border border-emerald-100')
content = content.replace('bg-emerald-500/[0.04]', 'bg-emerald-50')
content = content.replace('border-emerald-500/20', 'border-emerald-100')
content = content.replace('bg-emerald-500/10', 'bg-emerald-50')

with open('app/careers/[company]/page.tsx', 'w') as f:
    f.write(content)

print("Redesign complete.")
