import Foundation

final class WarehouseStore: ObservableObject {
    @Published var layout: WarehouseLayout

    private let filename = "warehouse-layout.json"

    init() {
        if let loaded = Self.loadFromDisk(filename: filename) {
            layout = loaded
        } else {
            layout = WarehouseLayout(name: "Mon entrepôt", racks: [])
        }
    }

    func save() {
        guard let url = Self.fileURL(filename: filename) else { return }
        do {
            let data = try JSONEncoder().encode(layout)
            try data.write(to: url, options: .atomic)
        } catch {
            print("Erreur de sauvegarde: \(error)")
        }
    }

    private static func loadFromDisk(filename: String) -> WarehouseLayout? {
        guard let url = fileURL(filename: filename) else { return nil }
        guard let data = try? Data(contentsOf: url) else { return nil }
        return try? JSONDecoder().decode(WarehouseLayout.self, from: data)
    }

    private static func fileURL(filename: String) -> URL? {
        FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first?.appendingPathComponent(filename)
    }
}
