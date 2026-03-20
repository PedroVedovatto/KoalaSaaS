# Como Criar um Vídeo de Exemplo

## 🎬 Opções para criar Koala.mp4:

### 1. Usar Ferramentas Online:
- **Canva**: Criar vídeo animado simples
- **Lumen5**: Gerar vídeo a partir de imagem
- **InVideo**: Criar vídeo curto com texto

### 2. Usar Software Local:
- **PowerPoint**: Exportar slide como vídeo
- **Photoshop**: Criar animação e exportar
- **Filmora**: Editar vídeo simples

### 3. Converter Imagem para Vídeo:
```bash
# Usar FFmpeg (se instalado)
ffmpeg -loop 1 -i koala-image.jpg -t 3 -c:v libx264 -pix_fmt yuv420p Koala.mp4
```

### 4. Download de Vídeos Gratuitos:
- **Pexels**: Vídeos de animais
- **Pixabay**: Clipes gratuitos
- **Unsplash**: Vídeos em HD

### 📋 Especificações Necessárias:
- **Formato**: MP4
- **Duração**: 3-5 segundos
- **Resolução**: 640x640px (quadrado)
- **Tamanho**: Máximo 2MB
- **Codec**: H.264

### 🎨 Conteúdo Sugerido:
- **Koala animado** ou real
- **Logo da empresa** animado
- **Texto "Koala SaaS"** com animação
- **Gradiente animado** com branding

### ⚠️ Importante:
O vídeo precisa ser colocado em: `c:\KoalaSaaS\frontend\public\videos\Koala.mp4`
