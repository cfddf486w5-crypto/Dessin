import SwiftUI

@main
struct DessinApp: App {
    @StateObject private var store = WarehouseStore()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(store)
        }
    }
}
