import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';
import '../services/place_service.dart';
import '../i18n/localization_service.dart';

class ReportScreen extends StatefulWidget {
  final String contentType;
  final String contentId;
  final String? contentTitle;

  const ReportScreen({
    super.key,
    required this.contentType,
    required this.contentId,
    this.contentTitle,
  });

  @override
  State<ReportScreen> createState() => _ReportScreenState();
}

class _ReportScreenState extends State<ReportScreen> {
  final _formKey = GlobalKey<FormState>();
  String _selectedReason = 'OTHER';
  String _description = '';
  List<File> _selectedImages = [];
  bool _isSubmitting = false;

  final List<Map<String, String>> reasonOptions = [
    {'value': 'SPAM', 'label': '🚫 Spam'},
    {'value': 'HARASSMENT', 'label': '😠 Acoso'},
    {'value': 'HATE_SPEECH', 'label': '💬 Discurso de odio'},
    {'value': 'VIOLENCE', 'label': '🔪 Violencia'},
    {'value': 'SEXUAL_CONTENT', 'label': '🔞 Contenido sexual'},
    {'value': 'FALSE_INFO', 'label': '❌ Información falsa'},
    {'value': 'COPYRIGHT', 'label': '©️ Derechos de autor'},
    {'value': 'OTHER', 'label': '❓ Otro'},
  ];

  Future<void> _pickImages() async {
    final ImagePicker picker = ImagePicker();
    final List<XFile> pickedFiles = await picker.pickMultiImage(
      maxWidth: 1920,
      maxHeight: 1080,
      imageQuality: 85,
    );

    if (pickedFiles.isNotEmpty) {
      setState(() {
        _selectedImages.addAll(
          pickedFiles.map((file) => File(file.path)).toList(),
        );
      });
    }
  }

  void _removeImage(int index) {
    setState(() {
      _selectedImages.removeAt(index);
    });
  }

  Future<void> _submitReport() async {
    if (!_formKey.currentState!.validate()) return;
    if (_description.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Por favor describe el problema')),
      );
      return;
    }

    _formKey.currentState!.save();

    setState(() => _isSubmitting = true);

    try {
      final placeService = Provider.of<PlaceService>(context, listen: false);
      
      await placeService.createReport(
        contentType: widget.contentType,
        contentId: widget.contentId,
        reason: _selectedReason,
        description: _description,
        images: _selectedImages,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('✅ Reporte enviado exitosamente'),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.pop(context, true);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Reportar'),
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Información del contenido
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Contenido a reportar',
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Icon(
                            _getContentIcon(widget.contentType),
                            color: theme.primaryColor,
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  _getContentTypeLabel(widget.contentType),
                                  style: theme.textTheme.bodyMedium?.copyWith(
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                                if (widget.contentTitle != null)
                                  Text(
                                    widget.contentTitle!,
                                    style: theme.textTheme.bodySmall?.copyWith(
                                      color: Colors.grey,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),

              // Razón del reporte
              Text(
                'Razón del reporte',
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                value: _selectedReason,
                decoration: InputDecoration(
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 12,
                  ),
                ),
                items: reasonOptions.map((option) {
                  return DropdownMenuItem(
                    value: option['value'],
                    child: Text(option['label']!),
                  );
                }).toList(),
                onChanged: (value) {
                  if (value != null) {
                    setState(() => _selectedReason = value);
                  }
                },
              ),
              const SizedBox(height: 24),

              // Descripción
              Text(
                'Descripción del problema',
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 12),
              TextFormField(
                maxLines: 5,
                minLines: 3,
                decoration: InputDecoration(
                  hintText: 'Describe detalladamente por qué reportas este contenido...',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                  contentPadding: const EdgeInsets.all(16),
                ),
                onChanged: (value) => _description = value,
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'La descripción es requerida';
                  }
                  if (value.length < 10) {
                    return 'La descripción debe tener al menos 10 caracteres';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 24),

              // Imágenes de evidencia
              Text(
                'Imágenes de evidencia (opcional)',
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                'Puedes adjuntar hasta 5 imágenes como evidencia',
                style: theme.textTheme.bodySmall?.copyWith(
                  color: Colors.grey,
                ),
              ),
              const SizedBox(height: 12),

              // Botón para agregar imágenes
              if (_selectedImages.length < 5)
                ElevatedButton.icon(
                  onPressed: _pickImages,
                  icon: const Icon(Icons.add_photo_alternate),
                  label: Text(
                    _selectedImages.isEmpty
                        ? 'Agregar imágenes'
                        : 'Agregar más (${_selectedImages.length}/5)',
                  ),
                ),
              const SizedBox(height: 16),

              // Grid de imágenes seleccionadas
              if (_selectedImages.isNotEmpty)
                GridView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 3,
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                  ),
                  itemCount: _selectedImages.length,
                  itemBuilder: (context, index) {
                    return Stack(
                      children: [
                        Container(
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: Colors.grey[300]!),
                          ),
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(8),
                            child: Image.file(
                              _selectedImages[index],
                              fit: BoxFit.cover,
                            ),
                          ),
                        ),
                        Positioned(
                          top: 4,
                          right: 4,
                          child: GestureDetector(
                            onTap: () => _removeImage(index),
                            child: Container(
                              decoration: BoxDecoration(
                                color: Colors.red,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              padding: const EdgeInsets.all(4),
                              child: const Icon(
                                Icons.close,
                                color: Colors.white,
                                size: 16,
                              ),
                            ),
                          ),
                        ),
                      ],
                    );
                  },
                ),
              const SizedBox(height: 32),

              // Botón enviar
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _isSubmitting ? null : _submitReport,
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    backgroundColor: Colors.red,
                  ),
                  child: Text(
                    _isSubmitting ? 'Enviando...' : 'Enviar Reporte',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Información importante
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.blue[50],
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.blue[200]!),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'ℹ️ Información importante',
                      style: theme.textTheme.bodyMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                        color: Colors.blue[900],
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      '• Los reportes falsos pueden resultar en sanciones\n'
                      '• Nuestro equipo revisará tu reporte en 24-48 horas\n'
                      '• Recibirás una notificación cuando se resuelva',
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: Colors.blue[800],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  IconData _getContentIcon(String type) {
    switch (type) {
      case 'PLACE':
        return Icons.location_on;
      case 'USER':
        return Icons.person;
      case 'COMMENT':
        return Icons.comment;
      case 'REVIEW':
        return Icons.star;
      case 'PHOTO':
        return Icons.image;
      default:
        return Icons.flag;
    }
  }

  String _getContentTypeLabel(String type) {
    switch (type) {
      case 'PLACE':
        return 'Lugar';
      case 'USER':
        return 'Usuario';
      case 'COMMENT':
        return 'Comentario';
      case 'REVIEW':
        return 'Reseña';
      case 'PHOTO':
        return 'Foto';
      default:
        return 'Contenido';
    }
  }
}
