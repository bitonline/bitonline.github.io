"""Genera js/engine.js dal motore di avatar-ps1.html (stessa grafica dei video).
Uso: python tools/build_engine.py ../avatar-ps1.html
"""
import os, re, sys

src = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), '..', '..', 'avatar-ps1.html')
html = open(src, encoding='utf-8').read()
script = html.split('<script type="module">', 1)[1].split('</script>', 1)[0]
start = script.index('THREE.ColorManagement.enabled = false;')
end = script.index('// ---------- Audio ----------')
core = script[start:end]

stub = """const __stub = { jitter: { value: '1.5' }, ledMouth: { checked: true }, bgColor: { value: '#05080e' }, bg: { value: 'farm' }, autoHands: { checked: true }, camLive: { checked: false } };
const $ = id => (id === 'stage' ? document.getElementById(id) : null) || __stub[id] || { value: '', checked: false };"""
core = core.replace("const $ = id => document.getElementById(id);", stub, 1)

api = open(os.path.join(os.path.dirname(__file__), 'engine_api.js'), encoding='utf-8').read()
out = "// GENERATO da tools/build_engine.py — non modificare a mano\nimport * as THREE from 'three';\n\n" + core + "\n" + api
dst = os.path.join(os.path.dirname(__file__), '..', 'js', 'engine.js')
open(dst, 'w', encoding='utf-8').write(out)
print('engine.js:', len(out) // 1024, 'KB')
