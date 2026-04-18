package com.elegglab.magicalpotionmirror

import android.content.Intent
import android.os.Bundle
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.webkit.WebViewAssetLoader
import androidx.webkit.WebViewClientCompat
import com.elegglab.magicalpotionmirror.databinding.ActivityMainBinding
import java.io.FileNotFoundException
import java.net.URLConnection

class MainActivity : AppCompatActivity() {
    private lateinit var binding: ActivityMainBinding

    private val assetLoader by lazy {
        WebViewAssetLoader.Builder()
            .addPathHandler("/web/", MirrorAssetPathHandler())
            .build()
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG)
        configureWebView(binding.webView)

        if (savedInstanceState == null) {
            binding.webView.loadUrl(MIRROR_ENTRY_URL)
        } else {
            binding.webView.restoreState(savedInstanceState)
        }

        onBackPressedDispatcher.addCallback(
            this,
            object : OnBackPressedCallback(true) {
                override fun handleOnBackPressed() {
                    if (binding.webView.canGoBack()) {
                        binding.webView.goBack()
                    } else {
                        finish()
                    }
                }
            },
        )
    }

    override fun onSaveInstanceState(outState: Bundle) {
        binding.webView.saveState(outState)
        super.onSaveInstanceState(outState)
    }

    @Suppress("SetJavaScriptEnabled")
    private fun configureWebView(webView: WebView) {
        with(webView.settings) {
            javaScriptEnabled = true
            domStorageEnabled = true
            cacheMode = WebSettings.LOAD_DEFAULT
            mediaPlaybackRequiresUserGesture = false
            allowFileAccess = false
            allowContentAccess = false
            setSupportMultipleWindows(false)
        }

        webView.webChromeClient = WebChromeClient()
        webView.webViewClient =
            object : WebViewClientCompat() {
                override fun shouldInterceptRequest(
                    view: WebView,
                    request: WebResourceRequest,
                ) = assetLoader.shouldInterceptRequest(request.url)

                override fun shouldOverrideUrlLoading(
                    view: WebView,
                    request: WebResourceRequest,
                ): Boolean {
                    val uri = request.url
                    if (uri.host == APP_ASSET_HOST) {
                        return false
                    }

                    val externalIntent = Intent(Intent.ACTION_VIEW, uri)
                    if (externalIntent.resolveActivity(packageManager) != null) {
                        startActivity(externalIntent)
                    }
                    return true
                }
            }
    }

    companion object {
        private const val APP_ASSET_HOST = "appassets.androidplatform.net"
        private const val MIRROR_ENTRY_URL = "https://$APP_ASSET_HOST/web/index.html"
    }

    private inner class MirrorAssetPathHandler : WebViewAssetLoader.PathHandler {
        override fun handle(path: String): WebResourceResponse? {
            val relativePath = path.removePrefix("/").ifBlank { "index.html" }
            val assetPath = "web/$relativePath"

            return try {
                val inputStream = assets.open(assetPath)
                WebResourceResponse(
                    guessMimeType(assetPath),
                    "UTF-8",
                    inputStream,
                )
            } catch (_: FileNotFoundException) {
                null
            }
        }

        private fun guessMimeType(assetPath: String): String =
            URLConnection.guessContentTypeFromName(assetPath)
                ?: when {
                    assetPath.endsWith(".js") -> "text/javascript"
                    assetPath.endsWith(".css") -> "text/css"
                    assetPath.endsWith(".html") -> "text/html"
                    assetPath.endsWith(".json") -> "application/json"
                    assetPath.endsWith(".svg") -> "image/svg+xml"
                    else -> "application/octet-stream"
                }
    }
}
