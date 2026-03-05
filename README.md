# Dessin – Layout d'entrepôt sur iPhone

Prototype d'app orientée iPhone pour dessiner un plan de warehouse et gérer des informations de bins.

## Version HTML (nouvelle)
Cette version Web fonctionne sur iPhone (Safari) et permet de :
- tracer des bins directement sur un canevas tactile,
- sélectionner et déplacer un bin,
- renseigner les données d'un bin (nom, location, section, zone, notes),
- supprimer un bin ou effacer tout le plan,
- sauvegarder/charger le plan en JSON,
- exporter le plan en PNG.

### Lancer localement
```bash
python3 -m http.server 8000
```
Puis ouvrir `http://localhost:8000`.

## Ancien prototype SwiftUI
Le dépôt contient aussi une base SwiftUI historique :
- `DessinApp.swift`
- `ContentView.swift`
- `WarehouseCanvasView.swift`
- `RackModels.swift`
- `WarehouseStore.swift`

## Travailler sur un host GitHub (Codespaces)
Le dépôt est prêt pour être ouvert dans un environnement hébergé par GitHub.

1. Ouvrez le dépôt sur GitHub.
2. Cliquez sur **Code** → **Codespaces** → **Create codespace on main** (ou votre branche).
3. GitHub démarre automatiquement le conteneur défini dans `.devcontainer/devcontainer.json`.
4. Le terminal exécute `swift --version` au premier démarrage pour vérifier l'environnement.
