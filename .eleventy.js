const fs = require("fs");
const sass = require("sass");
const postcss = require("postcss");
const cssnano = require("cssnano");
const esbuild = require("esbuild");
const autoprefixer = require("autoprefixer");
const isProduction = process.env.NODE_ENV === "production";

module.exports = function (eleventyConfig) {
  // Run esbuild
  eleventyConfig.on("afterBuild", async () => {
    await esbuild.build({
      entryPoints: ["src/assets/js/app.ts"],
      outdir: "public/js",
      minify: isProduction,
      sourcemap: !isProduction,
      plugins: [],
    });
  });

  // Compile CSS
  eleventyConfig.on("eleventy.before", async () => {
    const cssEntryFile = "src/assets/scss/style.scss";
    const cssOutDir = "public/css/";
    const cssOutFile = "style.css";
    const cssOutput = cssOutDir + cssOutFile;
    if (!fs.existsSync(cssOutDir)) {
      fs.mkdirSync(cssOutDir, { recursive: true });
    }

    // compile sass first.
    const compiled = await sass.compileAsync(cssEntryFile, {
      sourceMap: !isProduction,
    });

    // optimize our css via postcss.
    const postcssPlugins = [autoprefixer()];
    if (isProduction) postcssPlugins.push(cssnano());
    const output = await postcss(postcssPlugins)
      .process(compiled.css, { from: undefined })
      .then((r) => {
        let cleanCSS = r.css;
        cleanCSS = cleanCSS.replace(/,$\n/gm, ",");
        // TODO: Output the sourcemap too.
        // console.log(compiled.sourceMap);
        fs.writeFile(cssOutput, cleanCSS, (err) => {
          if (err) throw err;
          console.log(`[11ty] Writing Postcss output: ${cssOutput}`);
        });
      });
    return output;
  });

  eleventyConfig.addWatchTarget("./src/assets/js/");
  eleventyConfig.addWatchTarget("./src/assets/scss");

  return {
    dir: {
      input: "src",
      output: "public",
    },
  };
};
