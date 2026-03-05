# Dessin – Layout d'entrepôt sur iPhone

Prototype SwiftUI d'une app iPhone pour dessiner avec un stylet (Apple Pencil) et créer/modifier un plan de racks d'entrepôt.

## Fonctionnalités
- Création de racks par **glisser-déposer** sur la zone de plan.
- Sélection d'un rack avec affichage de ses dimensions.
- Déplacement d'un rack sélectionné.
- Changement de type de rack (palette, picking, froid, zone libre).
- Zoom et déplacement de la carte (pinch + drag avec deux doigts).
- Sauvegarde locale JSON.

## Structure
- `DessinApp.swift` : point d'entrée.
- `ContentView.swift` : shell principal + barre d'outils.
- `WarehouseCanvasView.swift` : zone de dessin interactive.
- `RackModels.swift` : modèles de données.
- `WarehouseStore.swift` : persistance locale.

## Intégration Xcode
Créez un projet iOS SwiftUI nommé `Dessin`, puis remplacez les fichiers générés par ceux du dépôt.
