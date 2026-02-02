// lib/widgets/place_card_widget.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/place_service.dart';
import '../services/auth_service.dart';

class PlaceCardWidget extends StatelessWidget {
  final Place place;
  final VoidCallback? onTap;

  const PlaceCardWidget({
    super.key,
    required this.place,
    this.onTap,
  });

  Widget _buildImage() {
    if (place.officialImages.isEmpty) {
      return Container(
        width: 90,
        height: 90,
        decoration: BoxDecoration(
          color: Colors.grey.shade300,
          borderRadius: BorderRadius.circular(12),
        ),
        child: const Icon(Icons.image_not_supported, color: Colors.grey),
      );
    }

    return ClipRRect(
      borderRadius: BorderRadius.circular(12),
      child: Image.network(
        place.officialImages.last,
        width: 90,
        height: 90,
        fit: BoxFit.cover,
        errorBuilder: (_, __, ___) =>
            Container(
              width: 90,
              height: 90,
              color: Colors.grey.shade300,
              child: const Icon(Icons.broken_image, color: Colors.red),
            ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final auth = Provider.of<AuthService>(context, listen: false);
    final isFavorite = auth.isPlaceFavorite(place.id);

    return InkWell(
      borderRadius: BorderRadius.circular(16),
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(12),
        margin: const EdgeInsets.symmetric(vertical: 6),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          color: theme.colorScheme.surface,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.08),
              blurRadius: 6,
              offset: const Offset(0, 3),
            )
          ],
        ),
        child: Row(
          children: [
            _buildImage(),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          place.name,
                          style: theme.textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w700,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      if (place.verified)
                        Padding(
                          padding: const EdgeInsets.only(left: 4),
                          child: Icon(
                            Icons.verified,
                            size: 18,
                            color: Colors.blue.shade600,
                          ),
                        ),
                    ],
                  ),

                  const SizedBox(height: 4),

                  Row(
                    children: [
                      Icon(Icons.star,
                          size: 18, color: Colors.amber.shade600),
                      const SizedBox(width: 4),
                      Text(
                        place.rating.toStringAsFixed(1),
                        style: theme.textTheme.bodyMedium,
                      ),
                    ],
                  ),

                  const SizedBox(height: 4),

                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: theme.colorScheme.primary.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      place.category,
                      style: TextStyle(
                        fontSize: 12,
                        color: theme.colorScheme.primary,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 6),
            if (isFavorite)
              Icon(
                Icons.bookmark,
                size: 22,
                color: theme.colorScheme.primary,
              ),
            const SizedBox(width: 4),
            const Icon(Icons.chevron_right, size: 28),
          ],
        ),
      ),
    );
  }
}
