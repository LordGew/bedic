// lib/screens/register/steps/step_policies.dart
import 'package:flutter/material.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import '../../../i18n/localization_service.dart';

class StepPolicies extends StatelessWidget {
  final bool terms;
  final bool privacy;
  final bool darkMode;
  final void Function(bool, bool, bool) onChanged;

  const StepPolicies({
    super.key,
    required this.terms,
    required this.privacy,
    required this.darkMode,
    required this.onChanged,
  });

  void _showDoc(BuildContext context, String asset, String title) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => Padding(
        padding: const EdgeInsets.all(20),
        child: FutureBuilder(
          future: DefaultAssetBundle.of(context).loadString('assets/legal/$asset'),
          builder: (_, snapshot) {
            if (!snapshot.hasData) return const Center(child: CircularProgressIndicator());
            return Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(title, style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: 16),
                SizedBox(
                  height: MediaQuery.of(context).size.height * 0.6,
                  child: Markdown(data: snapshot.data!),
                ),
                const SizedBox(height: 12),
                ElevatedButton(
                  onPressed: () => Navigator.pop(context),
                  child: Text(context.tr('common.cancel')),
                ),
              ],
            );
          },
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        Text(context.tr('register.policies'), style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: 24),

        // ✅ Ahora solo el texto es clickeable
        Row(
          children: [
            Checkbox(
              value: terms,
              onChanged: (v) => onChanged(v ?? false, privacy, darkMode),
            ),
            Expanded(
              child: InkWell(
                onTap: () => _showDoc(context, 'terms_of_use.md', context.tr('register.terms_title')),
                child: Text(context.tr('register.accept_terms'),
                    style: const TextStyle(decoration: TextDecoration.underline)),
              ),
            ),
          ],
        ),

        const SizedBox(height: 12),

        Row(
          children: [
            Checkbox(
              value: privacy,
              onChanged: (v) => onChanged(terms, v ?? false, darkMode),
            ),
            Expanded(
              child: InkWell(
                onTap: () => _showDoc(context, 'privacy_policy.md', context.tr('register.privacy_title')),
                child: Text(context.tr('register.accept_privacy'),
                    style: const TextStyle(decoration: TextDecoration.underline)),
              ),
            ),
          ],
        ),

        const SizedBox(height: 12),

        SwitchListTile(
          value: darkMode,
          onChanged: (v) => onChanged(terms, privacy, v),
          title: Text(context.tr('register.dark_mode')),
        ),
      ],
    );
  }
}
