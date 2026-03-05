import CoreGraphics
import Foundation

struct WarehouseLayout: Codable {
    var name: String
    var racks: [RackItem]
}

struct RackItem: Identifiable, Codable, Equatable {
    var id: UUID = UUID()
    var name: String
    var type: RackType
    var x: CGFloat
    var y: CGFloat
    var width: CGFloat
    var height: CGFloat

    var rect: CGRect {
        get { CGRect(x: x, y: y, width: width, height: height) }
        set {
            x = newValue.origin.x
            y = newValue.origin.y
            width = max(20, newValue.size.width)
            height = max(20, newValue.size.height)
        }
    }
}

enum RackType: String, CaseIterable, Codable, Identifiable {
    case palette
    case picking
    case cold
    case freeArea

    var id: String { rawValue }

    var title: String {
        switch self {
        case .palette: return "Palette"
        case .picking: return "Picking"
        case .cold: return "Froid"
        case .freeArea: return "Zone libre"
        }
    }

    var colorHex: String {
        switch self {
        case .palette: return "#4F46E5"
        case .picking: return "#10B981"
        case .cold: return "#06B6D4"
        case .freeArea: return "#F59E0B"
        }
    }
}
