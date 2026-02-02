// lib/screens/register/steps/step_summary.dart
import 'package:flutter/material.dart';
import '../../../i18n/localization_service.dart';

class StepSummary extends StatelessWidget {
  final String name, username, email;
  final bool terms, privacy;

  const StepSummary({super.key, required this.name, required this.username, required this.email, required this.terms, required this.privacy});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        Text(context.tr('register.summary'), style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: 16),
        ListTile(title: Text(context.tr('register.full_name')), subtitle: Text(name)),
        ListTile(title: Text(context.tr('register.username')), subtitle: Text(username)),
        ListTile(title: Text(context.tr('register.email')), subtitle: Text(email)),
        ListTile(title: Text(context.tr('register.terms_accepted')), subtitle: Text(terms ? context.tr('common.yes') : context.tr('common.no'))),
        ListTile(title: Text(context.tr('register.privacy_accepted')), subtitle: Text(privacy ? context.tr('common.yes') : context.tr('common.no'))),
      ],
    );
  }
}
