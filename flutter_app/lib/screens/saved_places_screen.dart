import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../services/place_service.dart';
import '../i18n/localization_service.dart';
import '../components/place_card_widget.dart';
import 'place_detail_screen.dart';

class SavedPlacesScreen extends StatefulWidget {
  const SavedPlacesScreen({super.key});

  @override
  State<SavedPlacesScreen> createState() => _SavedPlacesScreenState();
}

class _SavedPlacesScreenState extends State<SavedPlacesScreen> {
  late Future<List<Place>> _favoritesFuture;
  bool _initialized = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_initialized) {
      final placeService = Provider.of<PlaceService>(context, listen: false);
      _favoritesFuture = placeService.getFavoritePlaces();
      _initialized = true;
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Text(context.tr('saved_places.title')),
      ),
      body: FutureBuilder<List<Place>>(
        future: _favoritesFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            final msg = snapshot.error.toString();
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      context.tr('saved_places.error'),
                      textAlign: TextAlign.center,
                      style: theme.textTheme.titleMedium,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      msg,
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 16),
                    ElevatedButton.icon(
                      onPressed: () {
                        final placeService =
                            Provider.of<PlaceService>(context, listen: false);
                        setState(() {
                          _favoritesFuture = placeService.getFavoritePlaces();
                        });
                      },
                      icon: const Icon(Icons.refresh),
                      label: Text(context.tr('filter_apply')),
                    ),
                  ],
                ),
              ),
            );
          }

          final places = snapshot.data ?? const <Place>[];
          if (places.isEmpty) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24.0),
                child: Text(
                  context.tr('saved_places.empty'),
                  textAlign: TextAlign.center,
                ),
              ),
            );
          }

          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: places.length,
            itemBuilder: (context, index) {
              final place = places[index];
              return PlaceCardWidget(
                place: place,
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => PlaceDetailScreen(place: place),
                    ),
                  );
                },
              );
            },
          );
        },
      ),
    );
  }
}
