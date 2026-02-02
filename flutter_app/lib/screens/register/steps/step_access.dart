// lib/screens/register/steps/step_access.dart
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../../i18n/localization_service.dart';

class StepAccess extends StatefulWidget {
  final String email;
  final String password;
  final String referralCode;
  final void Function(String, String, String) onChanged;

  const StepAccess({super.key, required this.email, required this.password, required this.referralCode, required this.onChanged});

  @override
  State<StepAccess> createState() => _StepAccessState();
}

class _StepAccessState extends State<StepAccess> with SingleTickerProviderStateMixin {
  bool show = false;
  double strength = 0;

  late TextEditingController _emailCtrl;
  late TextEditingController _passCtrl;
  late TextEditingController _referralCtrl;
  late AnimationController _shakeCtrl;

  @override
  void initState() {
    super.initState();
    _emailCtrl = TextEditingController(text: widget.email);
    _passCtrl = TextEditingController(text: widget.password);
    _referralCtrl = TextEditingController(text: widget.referralCode);

    _shakeCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 350));

    _passCtrl.addListener(() {
      final p = _passCtrl.text;
      widget.onChanged(_emailCtrl.text, p, _referralCtrl.text);
      final newS = _calcStrength(p);

      if (newS <= 0.2 && p.isNotEmpty) {
        _shakeCtrl.forward(from: 0);
        HapticFeedback.heavyImpact();
      } else if (newS <= 0.4 && p.isNotEmpty) {
        HapticFeedback.lightImpact();
      }

      setState(() => strength = newS);
    });
  }

  double _calcStrength(String p) {
    int s = 0;
    if (p.length >= 8) s++;
    if (RegExp(r'[A-Z]').hasMatch(p)) s++;
    if (RegExp(r'[a-z]').hasMatch(p)) s++;
    if (RegExp(r'[0-9]').hasMatch(p)) s++;
    if (RegExp(r'[!@#\$&*~.,;]').hasMatch(p)) s++;
    return s / 5;
  }

  Color _color(double s) {
    if (s <= .2) return Colors.redAccent;
    if (s <= .4) return Colors.orangeAccent;
    if (s <= .7) return Colors.amberAccent;
    return Colors.greenAccent;
  }

  @override
  Widget build(BuildContext context) {
    final offset = sin(_shakeCtrl.value * pi * 3) * 8;

    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        Text(context.tr('register.access_data'), style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: 24),

        TextField(
          controller: _emailCtrl,
          keyboardType: TextInputType.emailAddress,
          decoration: InputDecoration(
            labelText: context.tr('register.email'),
            border: const UnderlineInputBorder(),
          ),
          onChanged: (v) => widget.onChanged(v, _passCtrl.text, _referralCtrl.text),
        ),

        const SizedBox(height: 24),

        Transform.translate(
          offset: Offset(offset, 0),
          child: TextField(
            controller: _passCtrl,
            obscureText: !show,
            decoration: InputDecoration(
              labelText: context.tr('register.password'),
              border: const UnderlineInputBorder(),
              suffixIcon: GestureDetector(
                onTap: () => setState(() => show = !show),
                child: AnimatedOpacity(
                  opacity: 1,
                  duration: const Duration(milliseconds: 200),
                  child: Icon(show ? Icons.visibility : Icons.visibility_off),
                ),
              ),
            ),
          ),
        ),

        const SizedBox(height: 24),

        TextField(
          controller: _referralCtrl,
          decoration: InputDecoration(
            labelText: context.tr('register.referral_code'),
            hintText: context.tr('register.referral_optional_hint'),
            border: const UnderlineInputBorder(),
          ),
          onChanged: (v) => widget.onChanged(_emailCtrl.text, _passCtrl.text, v),
        ),

        const SizedBox(height: 16),

        AnimatedContainer(
          duration: const Duration(milliseconds: 300),
          height: 6,
          width: MediaQuery.of(context).size.width * strength,
          decoration: BoxDecoration(
            color: _color(strength),
            borderRadius: BorderRadius.circular(4),
            boxShadow: [
              BoxShadow(color: _color(strength), blurRadius: 10, spreadRadius: 1),
            ],
          ),
        ),
      ],
    );
  }
}
