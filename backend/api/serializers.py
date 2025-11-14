from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Case, CaseNote, CaseFile, Event, SubEvent, Contestant, Judge, Criteria, Score

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_active']
        read_only_fields = ['id']

class CaseFileSerializer(serializers.ModelSerializer):
    uploaded_by = UserSerializer(read_only=True)
    
    class Meta:
        model = CaseFile
        fields = ['id', 'file', 'filename', 'description', 'uploaded_by', 'uploaded_at']
        read_only_fields = ['id', 'uploaded_by', 'uploaded_at']

class CaseNoteSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    
    class Meta:
        model = CaseNote
        fields = ['id', 'content', 'author', 'created_at']
        read_only_fields = ['id', 'author', 'created_at']

class CaseSerializer(serializers.ModelSerializer):
    assigned_to = UserSerializer(read_only=True)
    created_by = UserSerializer(read_only=True)
    notes = CaseNoteSerializer(many=True, read_only=True)
    files = CaseFileSerializer(many=True, read_only=True)
    
    class Meta:
        model = Case
        fields = [
            'id', 'case_number', 'title', 'description', 'status', 'priority',
            'assigned_to', 'created_by', 'created_at', 'updated_at', 'due_date',
            'notes', 'files'
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']

class CaseCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Case
        fields = [
            'case_number', 'title', 'description', 'status', 'priority',
            'assigned_to', 'due_date'
        ]

class EventSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    
    class Meta:
        model = Event
        fields = [
            'id', 'title', 'year', 'start_date', 'end_date', 'location',
            'status', 'created_by', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']

class EventCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = [
            'title', 'year', 'start_date', 'end_date', 'location', 'status'
        ]

class SubEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubEvent
        fields = [
            'id', 'event', 'title', 'date', 'time', 'location', 'status',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class ContestantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contestant
        fields = ['id', 'sub_event', 'name', 'order', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class JudgeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Judge
        fields = ['id', 'sub_event', 'name', 'code', 'type', 'order', 'created_at', 'updated_at']
        read_only_fields = ['id', 'code', 'created_at', 'updated_at']

class CriteriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Criteria
        fields = ['id', 'sub_event', 'name', 'points', 'order', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class ScoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Score
        fields = ['id', 'judge', 'contestant', 'criterion', 'score', 'comments', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class SubEventSettingsSerializer(serializers.Serializer):
    """Serializer for saving sub-event settings (contestants, judges, criteria)"""
    contestants = ContestantSerializer(many=True, required=False)
    judges = JudgeSerializer(many=True, required=False)
    criteria = CriteriaSerializer(many=True, required=False)

