from django.db import models
from django.contrib.auth.models import User
import random
import string

class Case(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('closed', 'Closed'),
    ]
    
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]
    
    case_number = models.CharField(max_length=50, unique=True)
    title = models.CharField(max_length=200)
    description = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_cases')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    due_date = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.case_number} - {self.title}"

class CaseNote(models.Model):
    case = models.ForeignKey(Case, on_delete=models.CASCADE, related_name='notes')
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Note for {self.case.case_number} by {self.author.username}"

class CaseFile(models.Model):
    case = models.ForeignKey(Case, on_delete=models.CASCADE, related_name='files')
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE)
    file = models.FileField(upload_to='case_files/')
    filename = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-uploaded_at']
    
    def __str__(self):
        return f"{self.filename} for {self.case.case_number}"

class Event(models.Model):
    STATUS_CHOICES = [
        ('deactivated', 'Deactivated'),
        ('activated', 'Activated'),
        ('completed', 'Completed'),
    ]
    
    title = models.CharField(max_length=200)
    year = models.IntegerField()
    start_date = models.DateField()
    end_date = models.DateField()
    location = models.CharField(max_length=200)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='deactivated')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_events')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-year', '-start_date']
    
    def __str__(self):
        return f"{self.title} ({self.year})"

class SubEvent(models.Model):
    STATUS_CHOICES = [
        ('deactivated', 'Deactivated'),
        ('activated', 'Activated'),
        ('completed', 'Completed'),
    ]
    
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='sub_events')
    title = models.CharField(max_length=200)
    date = models.DateField()
    time = models.TimeField()
    location = models.CharField(max_length=200)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='deactivated')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['date', 'time']
    
    def __str__(self):
        return f"{self.title} - {self.date}"

class Contestant(models.Model):
    sub_event = models.ForeignKey(SubEvent, on_delete=models.CASCADE, related_name='contestants')
    name = models.CharField(max_length=200)
    order = models.IntegerField(default=0)  # To maintain order of contestants
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['order', 'id']
    
    def __str__(self):
        return f"{self.name} - {self.sub_event.title}"

def generate_judge_code():
    """Generate a unique 6-digit numeric code for judge login"""
    while True:
        code = ''.join([str(random.randint(0, 9)) for _ in range(6)])
        if not Judge.objects.filter(code=code).exists():
            return code

class Judge(models.Model):
    TYPE_CHOICES = [
        ('judge', 'Judge'),
        ('chairman', 'Chairman of the Board'),
    ]
    
    sub_event = models.ForeignKey(SubEvent, on_delete=models.CASCADE, related_name='judges')
    name = models.CharField(max_length=200)
    code = models.CharField(max_length=6, unique=True)  # 6-digit random code for login
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='judge')
    order = models.IntegerField(default=0)  # To maintain order of judges
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['type', 'order', 'id']
    
    def __str__(self):
        return f"{self.name} ({self.code}) - {self.sub_event.title}"
    
    def save(self, *args, **kwargs):
        if not self.code:
            self.code = generate_judge_code()
        super().save(*args, **kwargs)

class Criteria(models.Model):
    sub_event = models.ForeignKey(SubEvent, on_delete=models.CASCADE, related_name='criteria')
    name = models.CharField(max_length=200)
    points = models.DecimalField(max_digits=5, decimal_places=2)  # Points as percentage
    order = models.IntegerField(default=0)  # To maintain order of criteria
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['order', 'id']
        verbose_name_plural = 'Criteria'
    
    def __str__(self):
        return f"{self.name} ({self.points}%) - {self.sub_event.title}"

class Score(models.Model):
    judge = models.ForeignKey(Judge, on_delete=models.CASCADE, related_name='scores')
    contestant = models.ForeignKey(Contestant, on_delete=models.CASCADE, related_name='scores')
    criterion = models.ForeignKey(Criteria, on_delete=models.CASCADE, related_name='scores')
    score = models.IntegerField(null=True, blank=True)  # Score as percentage (0-100), null if not scored yet
    comments = models.TextField(blank=True, default='')  # Comments for the contestant
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['judge', 'contestant', 'criterion']  # One score per judge per contestant per criterion
        ordering = ['contestant__order', 'criterion__order']
    
    def __str__(self):
        score_display = self.score if self.score is not None else 'Not scored'
        return f"{self.judge.name} - {self.contestant.name} - {self.criterion.name}: {score_display}%"

