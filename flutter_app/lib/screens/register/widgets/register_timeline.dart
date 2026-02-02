// lib/screens/register/widgets/register_timeline.dart
import 'package:flutter/material.dart';

class RegisterTimeline extends StatelessWidget {
  final int current;
  final int total;

  const RegisterTimeline({super.key, required this.current, required this.total});

  @override
  Widget build(BuildContext context) {
    final color = Theme.of(context).colorScheme.primary;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 24),
      child: Row(
        children: List.generate(total, (i) {
          final active = i <= current;

          return Expanded(
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 300),
              height: 4,
              margin: const EdgeInsets.symmetric(horizontal: 4),
              decoration: BoxDecoration(
                color: active ? color : Colors.grey.shade700,
                boxShadow: active
                    ? [
                        BoxShadow(
                          color: color.withOpacity(0.7),
                          blurRadius: 10,
                          spreadRadius: 1,
                        ),
                      ]
                    : null,
                borderRadius: BorderRadius.circular(4),
              ),
            ),
          );
        }),
      ),
    );
  }
}
