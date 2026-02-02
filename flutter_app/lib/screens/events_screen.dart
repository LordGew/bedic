import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:image_picker/image_picker.dart';
import 'package:flutter/foundation.dart';
import 'dart:typed_data';
import 'dart:io';
import '../services/place_service.dart';
import '../i18n/localization_service.dart';

class EventsScreen extends StatefulWidget {
  final String placeId;

  const EventsScreen({super.key, required this.placeId});

  @override
  State<EventsScreen> createState() => _EventsScreenState();
}

class _EventsScreenState extends State<EventsScreen> {
  final _formKey = GlobalKey<FormState>();
  String _eventName = '';
  String _eventDescription = '';
  DateTime? _eventDate;
  TimeOfDay? _eventTime;
  bool _isLoading = false;
  XFile? _eventImageFile;
  Uint8List? _eventImageBytes;
  final ImagePicker _imagePicker = ImagePicker();

  Future<void> _pickImage() async {
    try {
      final XFile? pickedFile = await _imagePicker.pickImage(
        source: ImageSource.gallery,
        maxWidth: 800,
        maxHeight: 600,
        imageQuality: 80,
      );
      
      if (pickedFile != null) {
        // Leer bytes para Web
        final bytes = await pickedFile.readAsBytes();
        setState(() {
          _eventImageFile = pickedFile;
          _eventImageBytes = bytes;
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error al seleccionar imagen: $e')),
        );
      }
    }
  }

  void _removeImage() {
    setState(() {
      _eventImageFile = null;
      _eventImageBytes = null;
    });
  }

  Future<void> _selectDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now(),
      firstDate: DateTime.now(),
      lastDate: DateTime(2100),
    );
    if (picked != null) {
      setState(() {
        _eventDate = picked;
      });
    }
  }

  Future<void> _selectTime() async {
    final picked = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.now(),
    );
    if (picked != null) {
      setState(() {
        _eventTime = picked;
      });
    }
  }

  Future<void> _submitEvent() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }
    _formKey.currentState!.save();
    setState(() => _isLoading = true);

    try {
      if (_eventDate == null || _eventTime == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content: Text(context.tr('events.datetime_required'))),
        );
        return;
      }

      final dateTime = DateTime(
        _eventDate!.year,
        _eventDate!.month,
        _eventDate!.day,
        _eventTime!.hour,
        _eventTime!.minute,
      );

      final placeService =
          Provider.of<PlaceService>(context, listen: false);

      await placeService.createEventForPlace(
        placeId: widget.placeId,
        title: _eventName,
        description: _eventDescription,
        date: dateTime,
        imageFile: _eventImageFile,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(context.tr('events.submit_success'))),
        );
        Navigator.of(context).pop(true); // Volver a la pantalla de detalles
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('${context.tr('events.submit_error_prefix')} ${e.toString()}')),
        );
      }
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(context.tr('events.create_title'))),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Campo Nombre del Evento
              TextFormField(
                decoration: InputDecoration(labelText: context.tr('events.name_label')),
                onSaved: (value) => _eventName = value!,
                validator: (value) => value!.isEmpty ? context.tr('events.name_required') : null,
              ),
              const SizedBox(height: 16),
              // Campo Descripción
              TextFormField(
                decoration: InputDecoration(
                  labelText: context.tr('events.description_label'),
                  hintText: context.tr('events.description_hint'),
                  border: const OutlineInputBorder(),
                ),
                maxLines: 5,
                validator: (value) => value!.isEmpty ? context.tr('events.description_required') : null,
                onSaved: (value) => _eventDescription = value!,
              ),
              const SizedBox(height: 16),
              // Sección de Imagen del Evento
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.grey.shade300),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      context.tr('events.create.upload_image'),
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    const SizedBox(height: 12),
                    if (_eventImageFile != null)
                      Container(
                        width: double.infinity,
                        height: 200,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(8),
                          color: Colors.grey.shade100,
                        ),
                        child: Stack(
                          children: [
                            ClipRRect(
                              borderRadius: BorderRadius.circular(8),
                              child: kIsWeb
                                  ? Image.memory(
                                      _eventImageBytes!,
                                      width: double.infinity,
                                      height: 200,
                                      fit: BoxFit.cover,
                                      errorBuilder: (context, error, stackTrace) {
                                        return Container(
                                          width: double.infinity,
                                          height: 200,
                                          decoration: BoxDecoration(
                                            color: Colors.grey.shade200,
                                            borderRadius: BorderRadius.circular(8),
                                          ),
                                          child: const Icon(
                                            Icons.image_not_supported,
                                            size: 50,
                                            color: Colors.grey,
                                          ),
                                        );
                                      },
                                    )
                                  : Image.file(
                                      File(_eventImageFile!.path),
                                      width: double.infinity,
                                      height: 200,
                                      fit: BoxFit.cover,
                                      errorBuilder: (context, error, stackTrace) {
                                        return Container(
                                          width: double.infinity,
                                          height: 200,
                                          decoration: BoxDecoration(
                                            color: Colors.grey.shade200,
                                            borderRadius: BorderRadius.circular(8),
                                          ),
                                          child: const Icon(
                                            Icons.image_not_supported,
                                            size: 50,
                                            color: Colors.grey,
                                          ),
                                        );
                                      },
                                    ),
                            ),
                            Positioned(
                              top: 8,
                              right: 8,
                              child: IconButton(
                                onPressed: _removeImage,
                                icon: Container(
                                  padding: const EdgeInsets.all(4),
                                  decoration: BoxDecoration(
                                    color: Colors.red,
                                    borderRadius: BorderRadius.circular(20),
                                  ),
                                  child: const Icon(
                                    Icons.close,
                                    color: Colors.white,
                                    size: 16,
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      )
                    else
                      Container(
                        width: double.infinity,
                        height: 150,
                        decoration: BoxDecoration(
                          color: Colors.grey.shade100,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.grey.shade300, style: BorderStyle.solid),
                        ),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.add_photo_alternate_outlined,
                              size: 48,
                              color: Colors.grey.shade400,
                            ),
                            const SizedBox(height: 8),
                            Text(
                              context.tr('events.create.no_image'),
                              style: TextStyle(color: Colors.grey.shade600),
                            ),
                            const SizedBox(height: 8),
                            ElevatedButton.icon(
                              onPressed: _pickImage,
                              icon: const Icon(Icons.photo_library),
                              label: Text(context.tr('events.create.upload_image')),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Theme.of(context).primaryColor,
                                foregroundColor: Colors.white,
                              ),
                            ),
                          ],
                        ),
                      ),
                    const SizedBox(height: 8),
                    Text(
                      context.tr('events.create.image_hint'),
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Colors.grey.shade600,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              // Selector de Fecha
              Row(
                children: [
                  Text(context.tr('events.date_label')),
                  const SizedBox(width: 8),
                  ElevatedButton(
                    onPressed: _selectDate,
                    child: Text(_eventDate == null ? context.tr('events.date_select') : _eventDate!.toLocal().toString().split(' ')[0]),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              // Selector de Hora
              Row(
                children: [
                  Text(context.tr('events.time_label')),
                  const SizedBox(width: 8),
                  ElevatedButton(
                    onPressed: _selectTime,
                    child: Text(_eventTime == null ? context.tr('events.time_select') : _eventTime!.format(context)),
                  ),
                ],
              ),
              const SizedBox(height: 30),
              ElevatedButton(
                onPressed: _isLoading ? null : _submitEvent,
                style: ElevatedButton.styleFrom(minimumSize: const Size.fromHeight(50)),
                child: _isLoading 
                    ? const CircularProgressIndicator() 
                    : Text(context.tr('events.submit')),
              ),
            ],
          ),
        ),
      ),
    );
  }
}