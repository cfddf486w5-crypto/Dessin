import SwiftUI

struct WarehouseCanvasView: View {
    @Binding var racks: [RackItem]
    @Binding var selectedRackID: UUID?
    @Binding var selectedType: RackType

    @State private var draftRect: CGRect?
    @State private var draftOrigin: CGPoint?
    @State private var dragStartRackRect: CGRect?

    @State private var canvasScale: CGFloat = 1
    @State private var lastScale: CGFloat = 1

    var body: some View {
        GeometryReader { geo in
            ZStack {
                gridBackground(size: geo.size)

                ForEach(racks) { rack in
                    RackShapeView(rack: rack, isSelected: rack.id == selectedRackID)
                        .onTapGesture {
                            selectedRackID = rack.id
                            selectedType = rack.type
                        }
                        .gesture(moveRackGesture(for: rack))
                }

                if let draftRect {
                    Rectangle()
                        .strokeBorder(style: StrokeStyle(lineWidth: 2, dash: [8, 5]))
                        .foregroundStyle(.orange)
                        .frame(width: draftRect.width, height: draftRect.height)
                        .position(x: draftRect.midX, y: draftRect.midY)
                }
            }
            .contentShape(Rectangle())
            .scaleEffect(canvasScale)
            .gesture(drawRackGesture)
            .simultaneousGesture(zoomGesture)
            .background(Color(white: 0.95))
            .clipShape(RoundedRectangle(cornerRadius: 12))
        }
    }

    private func gridBackground(size: CGSize) -> some View {
        Canvas { context, _ in
            let step: CGFloat = 40
            let path = Path { p in
                stride(from: 0 as CGFloat, through: 4000, by: step).forEach { x in
                    p.move(to: CGPoint(x: x, y: 0))
                    p.addLine(to: CGPoint(x: x, y: 4000))
                }
                stride(from: 0 as CGFloat, through: 4000, by: step).forEach { y in
                    p.move(to: CGPoint(x: 0, y: y))
                    p.addLine(to: CGPoint(x: 4000, y: y))
                }
            }
            context.stroke(path, with: .color(Color.gray.opacity(0.2)), lineWidth: 1)
        }
        .frame(width: size.width, height: size.height)
    }

    private var drawRackGesture: some Gesture {
        DragGesture(minimumDistance: 0)
            .onChanged { value in
                guard selectedRackID == nil else { return }
                if draftOrigin == nil { draftOrigin = value.startLocation }
                guard let origin = draftOrigin else { return }

                let rect = CGRect(
                    x: min(origin.x, value.location.x),
                    y: min(origin.y, value.location.y),
                    width: abs(value.location.x - origin.x),
                    height: abs(value.location.y - origin.y)
                )
                draftRect = rect
            }
            .onEnded { _ in
                defer {
                    draftOrigin = nil
                    draftRect = nil
                }
                guard let draftRect, draftRect.width > 12, draftRect.height > 12 else { return }
                let newRack = RackItem(
                    name: "Rack \(racks.count + 1)",
                    type: selectedType,
                    x: draftRect.origin.x,
                    y: draftRect.origin.y,
                    width: draftRect.width,
                    height: draftRect.height
                )
                racks.append(newRack)
                selectedRackID = newRack.id
            }
    }

    private func moveRackGesture(for rack: RackItem) -> some Gesture {
        DragGesture(minimumDistance: 5)
            .onChanged { value in
                guard let idx = racks.firstIndex(where: { $0.id == rack.id }) else { return }
                if dragStartRackRect == nil {
                    selectedRackID = rack.id
                    dragStartRackRect = racks[idx].rect
                }
                guard let originRect = dragStartRackRect else { return }
                racks[idx].rect = originRect.offsetBy(dx: value.translation.width, dy: value.translation.height)
            }
            .onEnded { _ in
                dragStartRackRect = nil
            }
    }

    private var zoomGesture: some Gesture {
        MagnificationGesture()
            .onChanged { value in
                canvasScale = max(0.5, min(3, lastScale * value))
            }
            .onEnded { _ in
                lastScale = canvasScale
            }
    }
}

private struct RackShapeView: View {
    let rack: RackItem
    let isSelected: Bool

    var body: some View {
        RoundedRectangle(cornerRadius: 8)
            .fill(color.opacity(0.25))
            .overlay(
                RoundedRectangle(cornerRadius: 8)
                    .stroke(isSelected ? color : color.opacity(0.55), lineWidth: isSelected ? 3 : 1.5)
            )
            .overlay(alignment: .topLeading) {
                VStack(alignment: .leading, spacing: 2) {
                    Text(rack.name).font(.caption.bold())
                    Text("\(Int(rack.width)) x \(Int(rack.height))").font(.caption2)
                }
                .padding(6)
                .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 8))
                .padding(6)
            }
            .frame(width: rack.width, height: rack.height)
            .position(x: rack.x + rack.width / 2, y: rack.y + rack.height / 2)
    }

    private var color: Color {
        Color(hex: rack.type.colorHex)
    }
}

private extension Color {
    init(hex: String) {
        let string = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: string).scanHexInt64(&int)
        let r, g, b: UInt64
        switch string.count {
        case 6:
            (r, g, b) = ((int >> 16) & 255, (int >> 8) & 255, int & 255)
        default:
            (r, g, b) = (128, 128, 128)
        }
        self.init(.sRGB, red: Double(r) / 255, green: Double(g) / 255, blue: Double(b) / 255, opacity: 1)
    }
}
