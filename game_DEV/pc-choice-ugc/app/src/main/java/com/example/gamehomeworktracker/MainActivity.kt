package com.example.gamehomeworktracker

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import com.example.gamehomeworktracker.navigation.AppNavGraph
import com.example.gamehomeworktracker.ui.theme.GameHomeworkTrackerTheme
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            GameHomeworkTrackerTheme {
                AppNavGraph()
            }
        }
    }
}
