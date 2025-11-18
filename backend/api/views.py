from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework.authtoken.models import Token
from .models import Case, CaseNote, CaseFile, Event, SubEvent, Contestant, Judge, Criteria, Score
from .serializers import (
    UserSerializer, CaseSerializer, CaseCreateSerializer,
    CaseNoteSerializer, CaseFileSerializer, EventSerializer, EventCreateSerializer,
    SubEventSerializer, ContestantSerializer, JudgeSerializer, CriteriaSerializer, ScoreSerializer
)
from .models import generate_judge_code

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """
    Custom login view that authenticates user and returns token
    """
    username = request.data.get('username')
    password = request.data.get('password')
    
    print(f"Login attempt - Username: {username}")  # Debug log
    
    if not username or not password:
        print("Missing username or password")
        return Response(
            {'error': 'Username and password are required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Check if user exists
    try:
        user = User.objects.get(username=username)
        print(f"User found: {user.username}")
    except User.DoesNotExist:
        print(f"User not found: {username}")
        return Response(
            {'error': 'Invalid username or password'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    # Authenticate user
    user = authenticate(username=username, password=password)
    print(f"Authentication result: {user is not None}")
    
    if user is not None:
        # Get or create token for the user
        token, created = Token.objects.get_or_create(user=user)
        print(f"Token created/retrieved: {token.key[:10]}...")
        
        # Return user data and token
        return Response({
            'token': token.key,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
            }
        })
    else:
        print("Authentication failed - invalid password")
        return Response(
            {'error': 'Invalid username or password'},
            status=status.HTTP_401_UNAUTHORIZED
        )

@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    """
    Registration view that creates a new user and returns token
    """
    username = request.data.get('username')
    password = request.data.get('password')
    email = request.data.get('email', '')
    first_name = request.data.get('first_name', '')
    last_name = request.data.get('last_name', '')
    
    print(f"Registration attempt - Username: {username}")  # Debug log
    
    # Validate required fields
    if not username or not password:
        return Response(
            {'error': 'Username and password are required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Check if username already exists
    if User.objects.filter(username=username).exists():
        return Response(
            {'error': 'Username already exists'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Check if email already exists (if provided)
    if email and User.objects.filter(email=email).exists():
        return Response(
            {'error': 'Email already registered'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Validate password strength (minimum 8 characters)
    if len(password) < 8:
        return Response(
            {'error': 'Password must be at least 8 characters long'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Create new user
    try:
        user = User.objects.create_user(
            username=username,
            password=password,
            email=email,
            first_name=first_name,
            last_name=last_name
        )
        print(f"User created: {user.username}")
        
        # Create token for the new user
        token = Token.objects.create(user=user)
        print(f"Token created: {token.key[:10]}...")
        
        # Return user data and token
        return Response({
            'token': token.key,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
            },
            'message': 'Registration successful'
        }, status=status.HTTP_201_CREATED)
    except Exception as e:
        print(f"Error creating user: {str(e)}")
        return Response(
            {'error': 'Failed to create user. Please try again.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

class CaseViewSet(viewsets.ModelViewSet):
    queryset = Case.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return CaseCreateSerializer
        return CaseSerializer
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def add_note(self, request, pk=None):
        case = self.get_object()
        serializer = CaseNoteSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(case=case, author=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def upload_file(self, request, pk=None):
        case = self.get_object()
        serializer = CaseFileSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(case=case, uploaded_by=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CaseNoteViewSet(viewsets.ModelViewSet):
    queryset = CaseNote.objects.all()
    serializer_class = CaseNoteSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

class CaseFileViewSet(viewsets.ModelViewSet):
    queryset = CaseFile.objects.all()
    serializer_class = CaseFileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)

class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """
        Filter events to only show those created by the authenticated user
        """
        return Event.objects.filter(created_by=self.request.user)
    
    def get_serializer_class(self):
        if self.action == 'create':
            return EventCreateSerializer
        return EventSerializer
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def verify_password_view(request):
    """
    Verify the authenticated user's password
    """
    password = request.data.get('password')
    
    if not password:
        return Response(
            {'error': 'Password is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Authenticate with the current user's username and provided password
    user = authenticate(username=request.user.username, password=password)
    
    if user is not None:
        return Response({'verified': True})
    else:
        return Response(
            {'error': 'Incorrect password', 'verified': False},
            status=status.HTTP_401_UNAUTHORIZED
        )

class SubEventViewSet(viewsets.ModelViewSet):
    queryset = SubEvent.objects.all()
    serializer_class = SubEventSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """
        Filter sub-events to only show those belonging to events created by the authenticated user
        """
        return SubEvent.objects.filter(event__created_by=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save()

@api_view(['POST'])
@permission_classes([AllowAny])
def judge_login_view(request):
    """
    Judge login using judge code
    """
    code = request.data.get('code')
    
    if not code:
        return Response(
            {'error': 'Judge code is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        judge = Judge.objects.select_related('sub_event', 'sub_event__event').get(code=code)
        
        # Return judge data with sub-event and event details
        return Response({
            'judge': {
                'id': judge.id,
                'name': judge.name,
                'code': judge.code,
                'type': judge.type,
                'sub_event': {
                    'id': judge.sub_event.id,
                    'title': judge.sub_event.title,
                    'date': judge.sub_event.date,
                    'time': judge.sub_event.time,
                    'location': judge.sub_event.location,
                    'event': {
                        'id': judge.sub_event.event.id,
                        'title': judge.sub_event.event.title,
                        'year': judge.sub_event.event.year,
                    }
                }
            }
        })
    except Judge.DoesNotExist:
        return Response(
            {'error': 'Invalid judge code'},
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['GET', 'POST'])
@permission_classes([AllowAny])  # Allow judges (who don't have tokens) to access GET
def subevent_settings_view(request, subevent_id):
    """
    GET: Retrieve all settings (contestants, judges, criteria) for a sub-event
    POST: Save settings for a sub-event (replaces all existing settings)
    """
    try:
        sub_event = SubEvent.objects.get(id=subevent_id)
    except SubEvent.DoesNotExist:
        return Response(
            {'error': 'Sub-event not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    if request.method == 'GET':
        # Get all contestants, judges, and criteria for this sub-event
        # Allow public access for judges to view settings
        contestants = Contestant.objects.filter(sub_event=sub_event)
        judges = Judge.objects.filter(sub_event=sub_event)
        criteria = Criteria.objects.filter(sub_event=sub_event)
        
        return Response({
            'contestants': ContestantSerializer(contestants, many=True).data,
            'judges': JudgeSerializer(judges, many=True).data,
            'criteria': CriteriaSerializer(criteria, many=True).data,
        })
    
    elif request.method == 'POST':
        # Only authenticated users can save settings
        if not request.user or not request.user.is_authenticated:
            return Response(
                {'error': 'Authentication required'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Verify that the sub-event belongs to an event created by the authenticated user
        if not sub_event.event.created_by or sub_event.event.created_by != request.user:
            return Response(
                {'error': 'You do not have permission to modify this sub-event'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            # Delete existing settings
            Contestant.objects.filter(sub_event=sub_event).delete()
            Judge.objects.filter(sub_event=sub_event).delete()
            Criteria.objects.filter(sub_event=sub_event).delete()
            
            # Create new contestants
            contestants_data = request.data.get('contestants', [])
            contestants = []
            for idx, contestant_data in enumerate(contestants_data):
                if contestant_data and contestant_data.get('name'):  # Only create if name is not empty
                    try:
                        contestant = Contestant.objects.create(
                            sub_event=sub_event,
                            name=contestant_data['name'],
                            order=idx
                        )
                        contestants.append(ContestantSerializer(contestant).data)
                    except Exception as e:
                        return Response(
                            {'error': f'Error creating contestant: {str(e)}'},
                            status=status.HTTP_400_BAD_REQUEST
                        )
            
            # Create new judges
            judges_data = request.data.get('judges', [])
            judges = []
            for idx, judge_data in enumerate(judges_data):
                if judge_data and judge_data.get('name'):  # Only create if name is not empty
                    try:
                        # Use existing code if provided and valid, otherwise generate new one
                        code = judge_data.get('code')
                        if code and len(code) == 6 and code.isdigit():
                            # Verify code is unique (check all other judges since we deleted this sub_event's judges)
                            if Judge.objects.filter(code=code).exists():
                                code = generate_judge_code()  # Generate new if code already exists for another judge
                        else:
                            code = generate_judge_code()  # Generate unique 6-digit code
                        
                        judge = Judge.objects.create(
                            sub_event=sub_event,
                            name=judge_data['name'],
                            code=code,
                            type=judge_data.get('type', 'judge'),
                            order=idx
                        )
                        judges.append(JudgeSerializer(judge).data)
                    except Exception as e:
                        return Response(
                            {'error': f'Error creating judge: {str(e)}'},
                            status=status.HTTP_400_BAD_REQUEST
                        )
            
            # Create new criteria
            criteria_data = request.data.get('criteria', [])
            criteria = []
            for idx, criterion_data in enumerate(criteria_data):
                if criterion_data and criterion_data.get('name'):  # Only create if name is not empty
                    try:
                        try:
                            points = float(criterion_data.get('points', 0))
                        except (ValueError, TypeError):
                            points = 0
                        
                        criterion = Criteria.objects.create(
                            sub_event=sub_event,
                            name=criterion_data['name'],
                            points=points,
                            order=idx
                        )
                        criteria.append(CriteriaSerializer(criterion).data)
                    except Exception as e:
                        return Response(
                            {'error': f'Error creating criteria: {str(e)}'},
                            status=status.HTTP_400_BAD_REQUEST
                        )
            
            return Response({
                'contestants': contestants,
                'judges': judges,
                'criteria': criteria,
                'message': 'Settings saved successfully'
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            import traceback
            print(f"Error saving settings: {str(e)}")
            print(traceback.format_exc())
            return Response(
                {'error': f'Failed to save settings: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

@api_view(['GET'])
@permission_classes([AllowAny])
def judge_scores_view(request, judge_id):
    """
    GET: Retrieve all scores for a specific judge
    """
    try:
        judge = Judge.objects.select_related('sub_event').get(id=judge_id)
    except Judge.DoesNotExist:
        return Response(
            {'error': 'Judge not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    scores = Score.objects.filter(judge=judge).select_related('contestant', 'criterion')
    
    # Organize scores by contestant
    scores_by_contestant = {}
    comments_by_contestant = {}
    
    for score in scores:
        contestant_id = score.contestant.id
        if contestant_id not in scores_by_contestant:
            scores_by_contestant[contestant_id] = {}
            comments_by_contestant[contestant_id] = score.comments or ''
        
        scores_by_contestant[contestant_id][score.criterion.id] = score.score
    
    return Response({
        'scores': scores_by_contestant,
        'comments': comments_by_contestant
    })

@api_view(['POST'])
@permission_classes([AllowAny])
def save_judge_scores_view(request, judge_id):
    """
    POST: Save/update scores for a judge
    Expected payload:
    {
        "scores": {
            "contestant_id": {
                "criterion_id": { "score": score_value },
                "comments": "comment text"
            }
        }
    }
    """
    try:
        judge = Judge.objects.get(id=judge_id)
    except Judge.DoesNotExist:
        return Response(
            {'error': 'Judge not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    saved_scores = []
    errors = []
    
    scores_data = request.data.get('scores', request.data)  # Support both formats
    
    for contestant_id, data in scores_data.items():
        try:
            contestant = Contestant.objects.get(id=contestant_id, sub_event=judge.sub_event)
        except (Contestant.DoesNotExist, ValueError):
            try:
                contestant_id_int = int(contestant_id)
                contestant = Contestant.objects.get(id=contestant_id_int, sub_event=judge.sub_event)
            except (Contestant.DoesNotExist, ValueError):
                errors.append(f'Contestant {contestant_id} not found')
                continue
        
        comments = data.get('comments', '')
        
        # Save/update scores for each criterion
        for criterion_id, criterion_data in data.items():
            if criterion_id == 'comments':
                continue
            
            try:
                criterion = Criteria.objects.get(id=criterion_id, sub_event=judge.sub_event)
            except (Criteria.DoesNotExist, ValueError):
                try:
                    criterion_id_int = int(criterion_id)
                    criterion = Criteria.objects.get(id=criterion_id_int, sub_event=judge.sub_event)
                except (Criteria.DoesNotExist, ValueError):
                    errors.append(f'Criterion {criterion_id} not found')
                    continue
            
            # Handle both {score: value} format and direct value format
            if isinstance(criterion_data, dict):
                score_value = criterion_data.get('score')
            else:
                score_value = criterion_data
            
            # Validate score value
            score_int = None
            if score_value is not None and score_value != '':
                try:
                    score_int = int(score_value)
                    if score_int < 0 or score_int > 100:
                        errors.append(f'Score {score_int} for criterion {criterion_id} is out of range (0-100)')
                        continue
                except (ValueError, TypeError):
                    # Allow null/empty scores
                    pass
            
            # Get or create the score
            score_obj, created = Score.objects.update_or_create(
                judge=judge,
                contestant=contestant,
                criterion=criterion,
                defaults={
                    'score': score_int,
                    'comments': comments  # Store comments with each score (they're the same per contestant)
                }
            )
            
            # If comments were updated, update all other scores for this contestant to keep them in sync
            if comments:
                Score.objects.filter(
                    judge=judge,
                    contestant=contestant
                ).exclude(id=score_obj.id).update(comments=comments)
            
            saved_scores.append(ScoreSerializer(score_obj).data)
    
    if errors:
        return Response({
            'saved': saved_scores,
            'errors': errors
        }, status=status.HTTP_207_MULTI_STATUS)
    
    return Response({
        'saved': saved_scores,
        'message': 'Scores saved successfully'
    }, status=status.HTTP_200_OK)

