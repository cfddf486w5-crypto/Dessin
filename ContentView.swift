import SwiftUI

struct ContentView: View {
    @EnvironmentObject private var store: WarehouseStore

    @State private var selectedRackID: UUID?
    @State private var selectedType: RackType = .palette

    var body: some View {
        NavigationStack {
            VStack(spacing: 12) {
                HStack {
                    TextField("Nom du layout", text: $store.layout.name)
                        .textFieldStyle(.roundedBorder)

                    Button("Sauvegarder") {
                        store.save()
                    }
                    .buttonStyle(.borderedProminent)
                }

                Picker("Type", selection: $selectedType) {
                    ForEach(RackType.allCases) { type in
                        Text(type.title).tag(type)
                    }
                }
                .pickerStyle(.segmented)

                WarehouseCanvasView(
                    racks: $store.layout.racks,
                    selectedRackID: $selectedRackID,
                    selectedType: $selectedType
                )

                controls
            }
            .padding()
            .navigationTitle("Layout racks")
        }
    }

    @ViewBuilder
    private var controls: some View {
        HStack {
            Button("Nouveau rack") {
                selectedRackID = nil
            }
            .buttonStyle(.bordered)

            Button("Supprimer sélection") {
                guard let selectedRackID else { return }
                store.layout.racks.removeAll { $0.id == selectedRackID }
                self.selectedRackID = nil
            }
            .buttonStyle(.bordered)

            if let selectedRackID,
               let idx = store.layout.racks.firstIndex(where: { $0.id == selectedRackID }) {
                Button("Appliquer type") {
                    store.layout.racks[idx].type = selectedType
                }
                .buttonStyle(.borderedProminent)
            }
        }
        .font(.subheadline)
    }
}
