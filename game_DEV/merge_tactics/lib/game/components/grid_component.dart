import 'package:flame/components.dart';
import 'package:flutter/material.dart';

class GridComponent extends PositionComponent {
  GridComponent({
    required this.columns,
    required this.rows,
    required this.cellSize,
  }) : super(size: Vector2(cellSize.x * columns, cellSize.y * rows));

  final int columns;
  final int rows;
  final Vector2 cellSize;

  @override
  Future<void> onLoad() async {
    for (int row = 0; row < rows; row++) {
      for (int col = 0; col < columns; col++) {
        add(
          RectangleComponent(
            position: Vector2(col * cellSize.x, row * cellSize.y),
            size: cellSize.clone(),
            paint: Paint()..color = const Color(0xFF111825),
            children: <Component>[
              RectangleComponent(
                size: cellSize.clone(),
                paint: Paint()
                  ..style = PaintingStyle.stroke
                  ..strokeWidth = 1
                  ..color = const Color(0xFF3A4B6D),
              ),
            ],
          ),
        );
      }
    }
  }

  Vector2 cellCenter(int col, int row) {
    return Vector2(
      col * cellSize.x + cellSize.x / 2,
      row * cellSize.y + cellSize.y / 2,
    );
  }
}
