package com.example.gamehomeworktracker.ui.info

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun InfoRoute(onBack: () -> Unit) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("정보") },
                navigationIcon = {
                    TextButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "뒤로")
                    }
                }
            )
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Text("데이터 출처")
            Text("- GachaList daily-resets: https://gachalist.com/daily-resets")
            Text("- 우마무스메 KR 공지: https://kakaogames.oqupie.com/portals/1576/articles/35175")
            Text("- 프리셋 생성 시점과 스키마는 assets/presets_kr_full.json에 기록됩니다.")
            Spacer(modifier = Modifier.height(8.dp))
            Text("주의")
            Text("외부 데이터의 라이선스/이용약관은 별도 확인이 필요합니다.")
            Spacer(modifier = Modifier.height(8.dp))
            Text("Unknown 항목은 자동 확정하지 않으며, 게임 추가 시 수동 설정 화면으로 유도됩니다.")
        }
    }
}
