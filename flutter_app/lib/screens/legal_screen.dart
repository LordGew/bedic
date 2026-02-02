import 'package:flutter/material.dart';
import 'package:flutter/services.dart' show rootBundle;
// Importamos la librería de Flutter para Markdown
// NOTA: Requiere que 'flutter_markdown' esté en pubspec.yaml (aunque esté discontinuado, 
// lo mantendremos como placeholder ya que es lo que espera el código)
import 'package:flutter_markdown/flutter_markdown.dart'; 


class LegalScreen extends StatefulWidget {
  final String title;
  final String assetPath; // Ruta al archivo .md

  const LegalScreen({super.key, required this.title, required this.assetPath});

  @override
  State<LegalScreen> createState() => _LegalScreenState();
}

class _LegalScreenState extends State<LegalScreen> {
  String _markdownContent = 'Cargando contenido...';

  @override
  void initState() {
    super.initState();
    _loadAsset();
  }

  void _loadAsset() async {
    try {
      final String content = await rootBundle.loadString(widget.assetPath);
      setState(() {
        _markdownContent = content;
      });
    } catch (e) {
      setState(() {
        _markdownContent = 'Error al cargar el archivo legal: ${widget.assetPath}';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.title),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        // Aquí se usa el widget MarkdownBody para renderizar el contenido
        // Si no tienes 'flutter_markdown', usa 'Text(_markdownContent)' como placeholder.
        child: MarkdownBody(data: _markdownContent),
      ),
    );
  }
}