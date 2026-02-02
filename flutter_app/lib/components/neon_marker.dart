import 'package:flutter/material.dart';

class NeonMarker extends StatefulWidget {
  const NeonMarker({super.key});

  @override
  State<NeonMarker> createState() => _NeonMarkerState();
}

class _NeonMarkerState extends State<NeonMarker>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _ctrl,
      builder: (_, __) {
        final glow = 6 + (_ctrl.value * 12);
        return Container(
          width: 26,
          height: 26,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: Colors.purpleAccent,
            boxShadow: [
              BoxShadow(
                color: Colors.purpleAccent.withOpacity(0.8),
                blurRadius: glow,
                spreadRadius: glow / 2,
              )
            ],
          ),
        );
      },
    );
  }
}
