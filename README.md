# 10xrate Website

Сайт и промо-страница сервиса 10xrate (`https://10xrate-887.redl.app/`).

## Структура проекта

- `index.html` — главная страница приложения со всеми стилями и интерактивными блоками
- `assets/` — локальные ассеты:
  - `app.css` — скомпилированный Tailwind CSS
  - `icons.js` — оптимизированный бандл иконок Lucide
  - `gsap.min.js` — библиотека анимаций GSAP
  - `fonts.css` и `fonts/` — локальные шрифты Inter (кириллица и латиница) в формате woff2
  - `*.webp` — оптимизированные изображения и баннеры
- `banner2.jpg`, `images/` — исходные изображения высокого разрешения
- `server.js` — Node.js HTTP сервер для отдачи статики и SPA маршрутизации
- `netlify.toml`, `_headers`, `_redirects` — конфигурационные файлы для развертывания на Netlify, Cloudflare Pages и других статических хостингах
- `build-tools/` — скрипты сборки (`build.js`, `tailwind.config.js`, `in.css`) для возможной повторной сборки и перегенерации ассетов

## Варианты деплоя

### Вариант 1: Статический хостинг (Netlify, Vercel, Cloudflare Pages, GitHub Pages)
Так как сайт полностью собран и самодостаточен, его можно задеплоить прямо из репозитория:
- **Netlify**: уже настроен через `netlify.toml` — просто импортируйте репозиторий в Netlify.
- **Cloudflare Pages / Vercel**: укажите корневую папку (`.`) в качестве Output Directory (Build command оставить пустой).
- **GitHub Pages**: включите GitHub Pages в настройках репозитория (Settings -> Pages -> Deploy from branch `main` / root).

### Вариант 2: Любой VPS / сервер (Node.js или Docker)
Запуск через Node.js (без дополнительных зависимостей):
```bash
PORT=8090 node server.js
```
Или с PM2:
```bash
pm2 start server.js --name 10xrate
```

### Вариант 3: Nginx / Caddy / Apache
Просто укажите корневую директорию проекта в качестве web root:
```caddy
example.com {
    root * /path/to/10xrate
    file_server
    try_files {path} /index.html
}
```
