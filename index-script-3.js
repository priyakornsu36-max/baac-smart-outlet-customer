
  /* Warm up Apps Script แบบเงียบ ๆ เพื่อลดเวลารอเมื่อกด Login ครั้งแรก */
  setTimeout(function() {
    try {
      google.script.run
        .withFailureHandler(function() {})
        .warmup();
    } catch (e) {}
  }, 80);