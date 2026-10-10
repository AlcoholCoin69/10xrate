module.exports = Object.assign({
      theme: {
        extend: {
          fontFamily: {
            sans: ['"Inter"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
          },
          colors: {
            app: {
              bg: '#141416',
              surface: '#1a1a1e',
              card: '#202026',
              border: '#2c2c36',
              borderLight: '#383842',
              primary: '#1877f2',
              primaryHover: '#006fee',
            }
          }
        }
      }
    }, { content: ["/opt/10xrate-fast/index.html"] });