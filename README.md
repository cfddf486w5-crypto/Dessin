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

## Travailler sur un host GitHub (Codespaces)
Le dépôt est prêt pour être ouvert dans un environnement hébergé par GitHub.

1. Ouvrez le dépôt sur GitHub.
2. Cliquez sur **Code** → **Codespaces** → **Create codespace on main** (ou votre branche).
3. GitHub démarre automatiquement le conteneur défini dans `.devcontainer/devcontainer.json`.
4. Le terminal exécute `swift --version` au premier démarrage pour vérifier l'environnement.

Ce mode est idéal pour contribuer rapidement sans configuration locale initiale.

## Vérification continue (GitHub Actions)
Le workflow `.github/workflows/repo-checks.yml` lance à chaque push/pull request :
- vérification de la présence des fichiers source principaux,
- validation du JSON de configuration Codespaces.

## Intégration Xcode
Créez un projet iOS SwiftUI nommé `Dessin`, puis remplacez les fichiers générés par ceux du dépôt.
