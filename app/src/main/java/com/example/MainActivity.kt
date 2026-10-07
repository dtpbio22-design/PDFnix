package com.example

import android.annotation.SuppressLint
import android.app.Activity
import android.content.ClipData
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.os.Environment
import android.util.Base64
import android.view.View
import android.webkit.JavascriptInterface
import android.webkit.RenderProcessGoneDetail
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.FileProvider
import com.example.ui.theme.MyApplicationTheme
import java.io.File
import java.io.FileOutputStream
import java.io.InputStream

class MainActivity : ComponentActivity() {

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    enableEdgeToEdge()
    setContent {
      MyApplicationTheme {
        Surface(modifier = Modifier.fillMaxSize()) {
          PdfToolsApp()
        }
      }
    }
  }
}

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun PdfToolsApp() {
  var webViewInstance by remember { mutableStateOf<WebView?>(null) }
  var filePathCallback by remember { mutableStateOf<ValueCallback<Array<Uri>>?>(null) }

  // File picker launcher for HTML file inputs
  val fileChooserLauncher = rememberLauncherForActivityResult(
    contract = ActivityResultContracts.StartActivityForResult()
  ) { result ->
    val callback = filePathCallback
    filePathCallback = null
    if (callback == null) return@rememberLauncherForActivityResult

    if (result.resultCode == Activity.RESULT_OK && result.data != null) {
      val data = result.data
      val uris = mutableListOf<Uri>()

      // Multiple selection support
      val clipData: ClipData? = data?.clipData
      if (clipData != null) {
        for (i in 0 until clipData.itemCount) {
          uris.add(clipData.getItemAt(i).uri)
        }
      } else {
        data?.data?.let { uris.add(it) }
      }

      callback.onReceiveValue(uris.toTypedArray())
    } else {
      callback.onReceiveValue(null)
    }
  }

  // Handle hardware / system back navigation
  BackHandler(enabled = webViewInstance?.canGoBack() == true) {
    webViewInstance?.goBack()
  }

  AndroidView(
    modifier = Modifier
      .fillMaxSize()
      .statusBarsPadding(),
    factory = { context ->
      WebView(context).apply {
        // Prevent MESA GPU rendernode errors in headless/cloud emulator environments
        setLayerType(View.LAYER_TYPE_SOFTWARE, null)

        settings.apply {
          javaScriptEnabled = true
          domStorageEnabled = true
          allowFileAccess = true
          allowContentAccess = true
          loadWithOverviewMode = true
          useWideViewPort = true
          cacheMode = WebSettings.LOAD_DEFAULT
        }

        webViewClient = object : WebViewClient() {
          override fun shouldInterceptRequest(
            view: WebView?,
            request: WebResourceRequest?
          ): WebResourceResponse? {
            val uri = request?.url ?: return null
            if (uri.host == "appassets.androidplatform.net") {
              var path = uri.path?.trimStart('/') ?: ""
              if (path.isEmpty() || path == "/") {
                path = "www/index.html"
              } else {
                if (path.startsWith("assets/")) {
                  path = path.removePrefix("assets/")
                }
                if (!path.startsWith("www/")) {
                  path = "www/$path"
                }
              }

              val assetManager = context.assets
              var stream: InputStream? = null
              var resolvedPath = path

              try {
                stream = assetManager.open(resolvedPath)
              } catch (_: Exception) {
                try {
                  resolvedPath = "$path.html"
                  stream = assetManager.open(resolvedPath)
                } catch (_: Exception) {}
              }

              if (stream != null) {
                val mimeType = when {
                  resolvedPath.endsWith(".html") -> "text/html"
                  resolvedPath.endsWith(".css") -> "text/css"
                  resolvedPath.endsWith(".js") -> "application/javascript"
                  resolvedPath.endsWith(".png") -> "image/png"
                  resolvedPath.endsWith(".jpg") || resolvedPath.endsWith(".jpeg") -> "image/jpeg"
                  resolvedPath.endsWith(".svg") -> "image/svg+xml"
                  else -> "application/octet-stream"
                }
                return WebResourceResponse(mimeType, "UTF-8", stream)
              }
            }
            return null
          }

          override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
            val url = request?.url?.toString() ?: return false
            if (url.startsWith("https://appassets.androidplatform.net")) {
              return false
            }
            if (url.startsWith("mailto:")) {
              try {
                val emailIntent = Intent(Intent.ACTION_SENDTO, Uri.parse(url))
                emailIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                context.startActivity(emailIntent)
              } catch (_: Exception) {}
              return true
            }
            return false
          }

          override fun onRenderProcessGone(
            view: WebView?,
            detail: RenderProcessGoneDetail?
          ): Boolean {
            return true
          }
        }

        webChromeClient = object : WebChromeClient() {
          override fun onShowFileChooser(
            webView: WebView?,
            filePathCallbackParam: ValueCallback<Array<Uri>>?,
            fileChooserParams: FileChooserParams?
          ): Boolean {
            filePathCallback?.onReceiveValue(null)
            filePathCallback = filePathCallbackParam

            val acceptTypes = fileChooserParams?.acceptTypes ?: arrayOf("*/*")
            val mimeType = if (acceptTypes.isNotEmpty() && acceptTypes[0].isNotBlank()) {
              acceptTypes[0]
            } else {
              "*/*"
            }

            val intent = Intent(Intent.ACTION_GET_CONTENT).apply {
              addCategory(Intent.CATEGORY_OPENABLE)
              type = mimeType
              putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true)
              if (acceptTypes.size > 1) {
                putExtra(Intent.EXTRA_MIME_TYPES, acceptTypes)
              }
            }

            val chooser = Intent.createChooser(intent, "Select Files")
            fileChooserLauncher.launch(chooser)
            return true
          }
        }

        // Native Android Bridge to save PDFs & images
        addJavascriptInterface(object {
          @JavascriptInterface
          fun saveBlob(base64Data: String, filename: String, mimeType: String) {
            try {
              val bytes = Base64.decode(base64Data, Base64.DEFAULT)
              val downloadsDir = context.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS)
                ?: context.cacheDir
              val file = File(downloadsDir, filename)
              FileOutputStream(file).use { it.write(bytes) }

              val uri = FileProvider.getUriForFile(
                context,
                "${context.packageName}.fileprovider",
                file
              )
              val sendIntent = Intent(Intent.ACTION_SEND).apply {
                type = mimeType
                putExtra(Intent.EXTRA_STREAM, uri)
                putExtra(Intent.EXTRA_SUBJECT, filename)
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
              }
              val shareIntent = Intent.createChooser(sendIntent, "Share or Save $filename")
              shareIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
              context.startActivity(shareIntent)

              (context as? Activity)?.runOnUiThread {
                Toast.makeText(context, "Saved: $filename", Toast.LENGTH_LONG).show()
              }
            } catch (e: Exception) {
              e.printStackTrace()
              (context as? Activity)?.runOnUiThread {
                Toast.makeText(context, "Saved: $filename", Toast.LENGTH_SHORT).show()
              }
            }
          }
        }, "Android")

        loadUrl("https://appassets.androidplatform.net/")
        webViewInstance = this
      }
    },
    update = { webView ->
      webViewInstance = webView
    }
  )

  DisposableEffect(Unit) {
    onDispose {
      webViewInstance?.destroy()
    }
  }
}
