// lib/screens/register/steps/step_personal.dart
import 'package:flutter/material.dart';
import '../../../i18n/localization_service.dart';

class StepPersonal extends StatefulWidget {
  final String name;
  final String username;
  final void Function(String, String) onChanged;

  const StepPersonal({super.key, required this.name, required this.username, required this.onChanged});

  @override
  State<StepPersonal> createState() => _StepPersonalState();
}

class _StepPersonalState extends State<StepPersonal> {
  late TextEditingController _nameCtrl;
  late TextEditingController _userCtrl;

  @override
  void initState() {
    super.initState();
    _nameCtrl = TextEditingController(text: widget.name);
    _userCtrl = TextEditingController(text: widget.username);
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        Text(context.tr('register.personal_info'), style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: 24),

        TextField(
          controller: _nameCtrl,
          autofocus: true,
          decoration: InputDecoration(
            labelText: context.tr('register.full_name'),
            border: const UnderlineInputBorder(),
            labelStyle: TextStyle(color: Theme.of(context).colorScheme.primary),
          ),
          onChanged: (v) => widget.onChanged(v, _userCtrl.text),
        ),

        const SizedBox(height: 16),

        TextField(
          controller: _userCtrl,
          decoration: InputDecoration(
            labelText: context.tr('register.username'),
            border: const UnderlineInputBorder(),
            labelStyle: TextStyle(color: Theme.of(context).colorScheme.primary),
          ),
          onChanged: (v) => widget.onChanged(_nameCtrl.text, v),
        ),
      ],
    );
  }
}
