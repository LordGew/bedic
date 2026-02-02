// lib/screens/report_form_screen.dart

import 'dart:io';
import 'dart:typed_data';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';

import '../services/place_service.dart';
import '../i18n/localization_service.dart';
import 'appeals_screen.dart';

class ReportFormScreen extends StatefulWidget {
  final String placeId;

  const ReportFormScreen({super.key, required this.placeId});

  @override
  State<ReportFormScreen> createState() => _ReportFormScreenState();
}

class _ReportFormScreenState extends State<ReportFormScreen> {
  final _formKey = GlobalKey<FormState>();
  String _type = "Inseguridad";
  String _description = "";
  XFile? _imageFile;
  bool _isLoading = false;

  final List<String> _reportTypes = [
    "Inseguridad",
    "Robo",
    "Mal Estado",
    "Basura",
    "Iluminación Deficiente",
    "Otro"
  ];

  String _localizedType(BuildContext context, String type) {
    switch (type) {
      case 'Inseguridad':
        return context.tr('report.type.insecurity');
      case 'Robo':
        return context.tr('report.type.robbery');
      case 'Mal Estado':
        return context.tr('report.type.bad_condition');
      case 'Basura':
        return context.tr('report.type.trash');
      case 'Iluminación Deficiente':
        return context.tr('report.type.poor_lighting');
      case 'Otro':
      default:
        return context.tr('report.type.other');
    }
  }

  // -------------------------------------------------
  // SELECCIONAR IMAGEN
  // -------------------------------------------------
  Future<void> _pickImage() async {
    final ImagePicker picker = ImagePicker();
    final XFile? picked =
        await picker.pickImage(source: ImageSource.gallery, imageQuality: 70);

    if (picked != null) {
      setState(() => _imageFile = picked);
    }
  }

  // -------------------------------------------------
  // ENVIAR REPORTE
  // -------------------------------------------------
  Future<void> _submitReport() async {
    if (!_formKey.currentState!.validate()) return;

    _formKey.currentState!.save();
    setState(() => _isLoading = true);

    final placeService = Provider.of<PlaceService>(context, listen: false);

    try {
      String? photoUrl;
      if (_imageFile != null) {
        Uint8List bytes;
        if (kIsWeb) {
          bytes = await _imageFile!.readAsBytes();
        } else {
          bytes = await File(_imageFile!.path).readAsBytes();
        }

        photoUrl = await placeService.uploadReportPhoto(
          bytes: bytes,
          filename: 'report_${widget.placeId}_${DateTime.now().millisecondsSinceEpoch}.jpg',
        );
      }

      await placeService.submitReport(
        placeId: widget.placeId,
        type: _type,
        description: _description,
        photoUrl: photoUrl,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(context.tr('report.submit_success'))),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        final raw = e.toString();
        final cleaned = raw.startsWith('Exception: ')
            ? raw.substring('Exception: '.length)
            : raw;
        final isSuspended = cleaned.toLowerCase().contains('suspendida');

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text("${context.tr('report.submit_error_prefix')} $cleaned"),
            action: isSuspended
                ? SnackBarAction(
                    label: context.tr('report.appeal'),
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => const AppealsScreen(),
                        ),
                      );
                    },
                  )
                : null,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  // -------------------------------------------------
  // BUILD
  // -------------------------------------------------
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(context.tr('report.create_title'))),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Tipo de reporte
              DropdownButtonFormField<String>(
                value: _type,
                items: _reportTypes
                    .map((t) => DropdownMenuItem(
                          value: t,
                          child: Text(_localizedType(context, t)),
                        ))
                    .toList(),
                onChanged: (v) => setState(() => _type = v!),
                decoration: InputDecoration(
                  labelText: context.tr('report.type_label'),
                  border: const OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 16),

              // Descripción
              TextFormField(
                maxLines: 5,
                decoration: InputDecoration(
                  labelText: context.tr('report.description_label'),
                  hintText: context.tr('report.description_hint'),
                  border: const OutlineInputBorder(),
                ),
                validator: (v) =>
                    (v == null || v.isEmpty) ? context.tr('report.description_required') : null,
                onSaved: (v) => _description = v ?? "",
              ),
              const SizedBox(height: 16),

              // Imagen
              Row(
                children: [
                  ElevatedButton.icon(
                    onPressed: _pickImage,
                    icon: const Icon(Icons.photo),
                    label: Text(context.tr('report.upload_photo')),
                  ),
                  const SizedBox(width: 12),
                  if (_imageFile != null)
                    ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: SizedBox(
                        width: 80,
                        height: 80,
                        child: kIsWeb
                            ? Image.network(
                                _imageFile!.path,
                                fit: BoxFit.cover,
                              )
                            : Image.file(
                                File(_imageFile!.path),
                                fit: BoxFit.cover,
                              ),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 30),

              // BOTÓN ENVIAR
              ElevatedButton(
                onPressed: _isLoading ? null : _submitReport,
                style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16)),
                child: _isLoading
                    ? const CircularProgressIndicator()
                    : Text(
                        context.tr('report.submit'),
                        style: const TextStyle(fontSize: 18),
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
