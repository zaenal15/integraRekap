(function (window) {
    // Ubah ke true saat development, false saat production
    const isDev = false;

    const assetBase = window.location.origin + "/assets";
    const assetJsPath = isDev ? "/js" : "/js-obfuscated";
    const urlToAssets = assetBase;
    const urlToViews = window.location.origin + "/views";
    const urlToTemplate = urlToViews + "/template";

    function getScriptPath(file) {
        return file.startsWith("plugins/")
            ? `${assetBase}/${file}`
            : `${assetBase}${assetJsPath}/${file}`;
    }

    window.AppConfig = {
        isDev,
        urlToAssets,
        urlToViews,
        urlToTemplate,
        getScriptPath,
    };
})(window);
