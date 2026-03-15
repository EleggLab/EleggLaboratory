package com.example.gamehomeworktracker.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.example.gamehomeworktracker.ui.add.AddGameRoute
import com.example.gamehomeworktracker.ui.home.HomeRoute
import com.example.gamehomeworktracker.ui.info.InfoRoute

private object Routes {
    const val HOME = "home"
    const val ADD_GAME = "add_game"
    const val INFO = "info"
}

@Composable
fun AppNavGraph() {
    val navController = rememberNavController()

    NavHost(
        navController = navController,
        startDestination = Routes.HOME
    ) {
        composable(Routes.HOME) {
            HomeRoute(
                onNavigateToAddGame = { navController.navigate(Routes.ADD_GAME) },
                onNavigateToInfo = { navController.navigate(Routes.INFO) }
            )
        }
        composable(Routes.ADD_GAME) {
            AddGameRoute(onBack = { navController.popBackStack() })
        }
        composable(Routes.INFO) {
            InfoRoute(onBack = { navController.popBackStack() })
        }
    }
}
