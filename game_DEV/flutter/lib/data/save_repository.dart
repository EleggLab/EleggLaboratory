import '../models/save_data.dart';
import '../services/storage_service.dart';

abstract class SaveRepository {
  Future<SaveData?> loadSave();
  Future<void> saveSave(SaveData saveData);
}

class LocalSaveRepository implements SaveRepository {
  LocalSaveRepository({required SaveStorageService storageService})
    : _storageService = storageService;

  final SaveStorageService _storageService;

  @override
  Future<SaveData?> loadSave() {
    return _storageService.load();
  }

  @override
  Future<void> saveSave(SaveData saveData) {
    return _storageService.save(saveData);
  }
}
