module.exports = {
  ci: {
    collect: {
      staticDistDir: './',
      settings: {
        formFactor: 'mobile',
        screenEmulation: {
          mobile: true,
          width: 412,
          height: 823,
          deviceScaleFactor: 1.75,
          disabled: false,
        },
        throttlingMethod: 'simulate',
        throttling: {
          rttMs: 150,
          throughputKbps: 1638.4, // Simula ~1.6 Mbps (4G lento)
          cpuSlowdownMultiplier: 4 // Reduce el procesador a una cuarta parte
        }
      }
    },
    upload: {
      target: 'filesystem',
      outputDir: './reportes-lighthouse'
    }
  }
};
