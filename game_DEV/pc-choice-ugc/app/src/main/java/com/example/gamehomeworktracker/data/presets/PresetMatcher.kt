package com.example.gamehomeworktracker.data.presets

import javax.inject.Inject
import javax.inject.Singleton
import kotlin.math.roundToInt

@Singleton
class PresetMatcher @Inject constructor() {
    fun match(
        appLabel: String,
        packageName: String,
        presets: List<PresetFlatGame>,
        limit: Int = 5
    ): List<PresetMatch> {
        if (presets.isEmpty()) return emptyList()

        val normalizedApp = normalize(appLabel)
        val normalizedPackage = packageName.lowercase()

        return presets
            .map { preset ->
                val labels = buildSet {
                    add(preset.displayName)
                    addAll(preset.aliases)
                }

                val normalizedLabels = labels.map(::normalize)
                val packageHintHit = preset.packageNameHints.any { it.equals(packageName, ignoreCase = true) }

                var score = 0
                var reason = "token-overlap"

                if (packageHintHit) {
                    score += 1_000
                    reason = "package-hint"
                }

                if (normalizedApp.isNotEmpty()) {
                    if (normalizedLabels.any { it == normalizedApp }) {
                        score += 700
                        reason = if (reason == "package-hint") reason else "name-exact"
                    } else if (normalizedLabels.any { it.contains(normalizedApp) || normalizedApp.contains(it) }) {
                        score += 400
                        reason = if (reason == "package-hint") reason else "name-contains"
                    }
                }

                val overlap = normalizedLabels.maxOfOrNull { tokenOverlap(it, normalizedApp) } ?: 0.0
                score += (overlap * 250).roundToInt()

                if (normalizedPackage.contains(preset.gameKey.replace("-", ""))) {
                    score += 120
                }

                PresetMatch(preset = preset, score = score, reason = reason)
            }
            .filter { it.score > 0 }
            .sortedWith(compareByDescending<PresetMatch> { it.score }.thenBy { it.preset.displayName.lowercase() })
            .take(limit)
    }

    private fun normalize(input: String): String {
        return input
            .lowercase()
            .replace(Regex("[^a-z0-9가-힣]+"), "")
            .trim()
    }

    private fun tokenOverlap(a: String, b: String): Double {
        if (a.isBlank() || b.isBlank()) return 0.0
        val tokensA = a.chunked(2).toSet()
        val tokensB = b.chunked(2).toSet()
        if (tokensA.isEmpty() || tokensB.isEmpty()) return 0.0
        val common = tokensA.intersect(tokensB).size.toDouble()
        return common / maxOf(tokensA.size, tokensB.size)
    }
}
