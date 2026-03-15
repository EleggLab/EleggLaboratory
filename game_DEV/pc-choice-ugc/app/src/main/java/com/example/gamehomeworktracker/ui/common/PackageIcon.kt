package com.example.gamehomeworktracker.ui.common

import android.widget.ImageView
import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.SportsEsports
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView

@Composable
fun PackageIcon(
    packageName: String,
    modifier: Modifier = Modifier,
    contentDescription: String? = null
) {
    val context = LocalContext.current
    val drawable = remember(packageName) {
        runCatching {
            context.packageManager.getApplicationIcon(packageName)
        }.getOrNull()
    }

    if (drawable == null) {
        Icon(
            imageVector = Icons.Default.SportsEsports,
            contentDescription = contentDescription,
            modifier = modifier.size(36.dp),
            tint = MaterialTheme.colorScheme.primary
        )
    } else {
        AndroidView(
            modifier = modifier,
            factory = { ctx ->
                ImageView(ctx).apply {
                    scaleType = ImageView.ScaleType.CENTER_CROP
                    setImageDrawable(drawable)
                    this.contentDescription = contentDescription
                }
            },
            update = { imageView ->
                imageView.setImageDrawable(drawable)
                imageView.contentDescription = contentDescription
            }
        )
    }
}
