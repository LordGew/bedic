import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../app_state.dart';
import '../themes/color_palette.dart';

class ColorPickerComponent extends StatelessWidget {
  const ColorPickerComponent({super.key});

  @override
  Widget build(BuildContext context) {
    final appState = Provider.of<AppState>(context);

    return Wrap(
      spacing: 8.0,
      runSpacing: 8.0,
      children: AppColors.corporateColors.map((color) {
        final isSelected = appState.corporateColor.value == color.value;
        return GestureDetector(
          onTap: () {
            appState.setCorporateColor(color); // Actualiza el estado
          },
          child: Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: color,
              shape: BoxShape.circle,
              border: isSelected
                  ? Border.all(color: Theme.of(context).colorScheme.onBackground, width: 3)
                  : null,
            ),
            child: isSelected ? const Icon(Icons.check, color: Colors.white) : null,
          ),
        );
      }).toList(),
    );
  }
}