import 'dart:async';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:provider/provider.dart';
import '../../services/auth_service.dart';
import '../map_screen.dart';
import '../../i18n/localization_service.dart';
import 'steps/step_personal.dart';
import 'steps/step_access.dart';
import 'steps/step_policies.dart';
import 'steps/step_summary.dart';
import 'widgets/register_timeline.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> with SingleTickerProviderStateMixin {
  final PageController _controller = PageController();
  int step = 0;
  bool loading = false;
  String name = "", username = "", email = "", password = "";
  bool acceptTerms = false, acceptPrivacy = false, darkMode = false;
  String referralCode = "";
  late AnimationController _shakeCtrl;

  @override
  void initState() {
    super.initState();
    _shakeCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 350));
    _loadDraft();
  }

  @override
  void dispose() {
    _shakeCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadDraft() async {
    final p = await SharedPreferences.getInstance();
    setState(() {
      name = p.getString("reg_name") ?? "";
      username = p.getString("reg_username") ?? "";
      email = p.getString("reg_email") ?? "";
      password = p.getString("reg_password") ?? "";
      acceptTerms = p.getBool("reg_terms") ?? false;
      acceptPrivacy = p.getBool("reg_privacy") ?? false;
      darkMode = p.getBool("reg_dark") ?? false;
      referralCode = p.getString("reg_referral") ?? "";
      step = p.getInt("reg_step") ?? 0;
    });
    WidgetsBinding.instance.addPostFrameCallback((_) => _controller.jumpToPage(step));
  }

  void _saveDraft() async {
    final p = await SharedPreferences.getInstance();
    p.setString("reg_name", name);
    p.setString("reg_username", username);
    p.setString("reg_email", email);
    p.setString("reg_password", password);
    p.setBool("reg_terms", acceptTerms);
    p.setBool("reg_privacy", acceptPrivacy);
    p.setBool("reg_dark", darkMode);
    p.setString("reg_referral", referralCode);
    p.setInt("reg_step", step);
  }

  bool get _stepValid {
    if (step == 0 && (name.trim().isEmpty || username.trim().length < 3)) return false;
    if (step == 1 && (!_validEmail(email) || password.length < 8)) return false;
    if (step == 2 && (!acceptTerms || !acceptPrivacy)) return false;
    return true;
  }

  bool _validEmail(String e) => RegExp(r"^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$").hasMatch(e);

  void _feedbackError() {
    _shakeCtrl.forward(from: 0);
    HapticFeedback.heavyImpact();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(context.tr('register.step_error'))),
    );
  }

  void _next() {
    if (!_stepValid) {
      _feedbackError();
      return;
    }
    if (step < 3) {
      setState(() => step++);
      _saveDraft();
      _controller.animateToPage(step,
          duration: const Duration(milliseconds: 350), curve: Curves.easeOutCubic);
    } else {
      _submit();
    }
  }

  void _back() {
    if (step == 0) return;
    setState(() => step--);
    _saveDraft();
    _controller.animateToPage(step,
        duration: const Duration(milliseconds: 350), curve: Curves.easeOutCubic);
  }

  Future<void> _submit() async {
    setState(() => loading = true);
    try {
      final auth = Provider.of<AuthService>(context, listen: false);
      await auth.register(name, username, email, password, referralCode: referralCode);
      final p = await SharedPreferences.getInstance();
      for (final key in [
        "reg_name",
        "reg_username",
        "reg_email",
        "reg_password",
        "reg_terms",
        "reg_privacy",
        "reg_dark",
        "reg_referral",
        "reg_step"
      ]) {
        p.remove(key);
      }
      if (!mounted) return;
      Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const MapScreen()));
    } catch (e) {
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text("Error: $e")));
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final primary = Theme.of(context).colorScheme.primary;
    final shakeOffset = sin(_shakeCtrl.value * pi * 3) * 12;

    return Scaffold(
      appBar: AppBar(
        title: Text(context.tr('register.title')),
        backgroundColor: Colors.black,
      ),
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              const Color(0xFF0A0A0A),
              Colors.deepPurple.shade900.withOpacity(0.8),
            ],
          ),
        ),
        child: SafeArea(
          child: Transform.translate(
            offset: Offset(shakeOffset, 0),
            child: Column(
              children: [
                RegisterTimeline(current: step, total: 4),
                Expanded(
                  child: PageView(
                    controller: _controller,
                    physics: const NeverScrollableScrollPhysics(),
                    children: [
                      StepPersonal(
                        name: name,
                        username: username,
                        onChanged: (n, u) {
                          name = n;
                          username = u;
                          _saveDraft();
                          setState(() {});
                        },
                      ),
                      StepAccess(
                        email: email,
                        password: password,
                        referralCode: referralCode,
                        onChanged: (e, p, r) {
                          email = e;
                          password = p;
                          referralCode = r;
                          _saveDraft();
                          setState(() {});
                        },
                      ),
                      StepPolicies(
                        terms: acceptTerms,
                        privacy: acceptPrivacy,
                        darkMode: darkMode,
                        onChanged: (t, p, d) {
                          acceptTerms = t;
                          acceptPrivacy = p;
                          darkMode = d;
                          _saveDraft();
                          setState(() {});
                        },
                      ),
                      StepSummary(
                        name: name,
                        username: username,
                        email: email,
                        terms: acceptTerms,
                        privacy: acceptPrivacy,
                      ),
                    ],
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      if (step > 0)
                        Expanded(
                          child: OutlinedButton(
                            style: OutlinedButton.styleFrom(
                              minimumSize: const Size.fromHeight(50),
                              side: BorderSide(color: primary),
                            ),
                            onPressed: _back,
                            child: Text(context.tr('register.back')),
                          ),
                        ),
                      if (step > 0) const SizedBox(width: 12),
                      Expanded(
                        child: ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            minimumSize: const Size.fromHeight(50),
                            backgroundColor: primary,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(10),
                            ),
                          ),
                          onPressed: loading ? null : _next,
                          child: loading
                              ? const CircularProgressIndicator(color: Colors.white)
                              : Text(step == 3
                                  ? context.tr('register.confirm')
                                  : context.tr('register.next')),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
