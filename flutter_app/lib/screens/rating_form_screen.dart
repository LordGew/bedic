// lib/screens/rating_form_screen.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/place_service.dart';

class RatingFormScreen extends StatefulWidget {
  final String placeId;

  const RatingFormScreen({super.key, required this.placeId});

  @override
  State<RatingFormScreen> createState() => _RatingFormScreenState();
}

class _RatingFormScreenState extends State<RatingFormScreen> {
  final _formKey = GlobalKey<FormState>();

  double _score = 5.0;
  String _comment = '';
  bool _isSubmitting = false;

  Future<void> _submitRating() async {
    if (!_formKey.currentState!.validate()) return;

    _formKey.currentState!.save();
    setState(() => _isSubmitting = true);

    final placeService = Provider.of<PlaceService>(context, listen: false);

    try {
      await placeService.submitRating(
        placeId: widget.placeId,
        score: _score,
        comment: _comment,
      );

      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Calificación enviada correctamente')),
      );

      Navigator.of(context).pop(); // volver al detalle
    } catch (e) {
      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: ${e.toString()}')),
      );
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  Widget _buildStarRow() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: List.generate(
        5,
        (i) {
          return Icon(
            i < _score ? Icons.star : Icons.star_border,
            color: Colors.amber.shade600,
            size: 32,
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Calificar Lugar'),
      ),

      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text('Tu puntuación', 
                style: theme.textTheme.titleMedium,
                textAlign: TextAlign.center,
              ),

              const SizedBox(height: 10),

              // Slider
              Slider(
                value: _score,
                min: 1,
                max: 5,
                divisions: 4,
                label: _score.toStringAsFixed(1),
                activeColor: Colors.amber.shade700,
                onChanged: (value) {
                  setState(() => _score = value);
                },
              ),

              _buildStarRow(),

              const SizedBox(height: 20),

              TextFormField(
                maxLines: 4,
                decoration: const InputDecoration(
                  border: OutlineInputBorder(),
                  labelText: 'Comentario (opcional)',
                  hintText: 'Escribe tu opinión...',
                ),
                onSaved: (v) => _comment = v?.trim() ?? '',
              ),

              const SizedBox(height: 30),

              ElevatedButton.icon(
                onPressed: _isSubmitting ? null : _submitRating,
                icon: _isSubmitting
                    ? const SizedBox(
                        height: 22,
                        width: 22,
                        child: CircularProgressIndicator(strokeWidth: 2))
                    : const Icon(Icons.send),
                label: Text(_isSubmitting ? 'Enviando...' : 'Enviar'),
                style: ElevatedButton.styleFrom(
                  minimumSize: const Size.fromHeight(52),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
