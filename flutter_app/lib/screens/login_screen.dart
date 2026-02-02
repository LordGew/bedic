import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/auth_service.dart';
import '../i18n/localization_service.dart';
import 'register/register_screen.dart';
import 'map_screen.dart';
import 'forgot_password_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> with SingleTickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();
  String _email = '';
  String _password = '';
  bool _loading = false;
  bool _showPass = false;
  late AnimationController _fadeCtrl;

  @override
  void initState() {
    super.initState();
    _fadeCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 900))
      ..forward();
  }

  @override
  void dispose() {
    _fadeCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    _formKey.currentState!.save();

    setState(() => _loading = true);
    try {
      await Provider.of<AuthService>(context, listen: false).login(_email, _password);
      if (!mounted) return;
      Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const MapScreen()));
    } catch (_) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(context.tr('login_error') ?? 'Error de autenticación')),
      );
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final primary = theme.colorScheme.primary;
    final isDark = theme.brightness == Brightness.dark;
    final gradientColors = isDark
        ? [
            const Color(0xFF0A0A0A),
            Colors.deepPurple.shade900.withOpacity(0.85),
          ]
        : [
            theme.colorScheme.background,
            theme.colorScheme.surface,
          ];

    return Scaffold(
      body: FadeTransition(
        opacity: _fadeCtrl,
        child: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: gradientColors,
            ),
          ),
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 20),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const SizedBox(height: 20),
                  Icon(Icons.explore, color: primary, size: 90),
                  const SizedBox(height: 24),
                  Text(
                    context.tr('login.title'),
                    style: theme.textTheme.headlineSmall?.copyWith(
                      color: theme.colorScheme.onBackground,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 28),

                  Form(
                    key: _formKey,
                    child: Column(
                      children: [
                        TextFormField(
                          style: theme.textTheme.bodyMedium?.copyWith(
                            color: theme.colorScheme.onSurface,
                          ),
                          decoration: InputDecoration(
                            labelText: context.tr('login.email'),
                            prefixIcon: Icon(Icons.email_outlined, color: primary),
                          ),
                          validator: (v) => !v!.contains('@')
                              ? context.tr('validation.email_invalid')
                              : null,
                          onSaved: (v) => _email = v!,
                        ),
                        const SizedBox(height: 16),
                        TextFormField(
                          obscureText: !_showPass,
                          style: theme.textTheme.bodyMedium?.copyWith(
                            color: theme.colorScheme.onSurface,
                          ),
                          decoration: InputDecoration(
                            labelText: context.tr('login.password'),
                            prefixIcon: Icon(Icons.lock_outline, color: primary),
                            suffixIcon: IconButton(
                              icon: Icon(
                                _showPass ? Icons.visibility : Icons.visibility_off,
                                color: primary,
                              ),
                              onPressed: () => setState(() => _showPass = !_showPass),
                            ),
                          ),
                          validator: (v) => v!.isEmpty
                              ? context.tr('validation.required')
                              : null,
                          onSaved: (v) => _password = v!,
                        ),
                      ],
                    ),
                  ),

                  Align(
                    alignment: Alignment.centerRight,
                    child: TextButton(
                      onPressed: () => Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => const ForgotPasswordScreen()),
                      ),
                      child: Text(context.tr('login.forgot'),
                          style: TextStyle(color: primary.withOpacity(0.8))),
                    ),
                  ),

                  const SizedBox(height: 24),

                  _loading
                      ? CircularProgressIndicator(
                          color: theme.colorScheme.primary,
                        )
                      : ElevatedButton(
                          onPressed: _submit,
                          style: ElevatedButton.styleFrom(
                            minimumSize: const Size.fromHeight(52),
                          ),
                          child: Text(
                            context.tr('login.submit'),
                          ),
                        ),
                  const SizedBox(height: 20),
                  TextButton(
                    onPressed: () => Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const RegisterScreen()),
                    ),
                    child: Text(
                      context.tr('login.register'),
                      style: TextStyle(color: primary, fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
